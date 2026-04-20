const autocannon = require('autocannon');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_DURATION = 20; // 每轮测试20秒

// 获取系统负载 - 使用更准确的CPU计算方法
async function getSystemLoad() {
  try {
    // 使用/proc/stat计算CPU使用率
    const { stdout: cpuStdout1 } = await execPromise("cat /proc/stat | grep '^cpu ' | awk '{print ($2+$3+$4+$5+$6+$7+$8)}'");
    const { stdout: idleStdout1 } = await execPromise("cat /proc/stat | grep '^cpu ' | awk '{print $5}'");
    
    await new Promise(r => setTimeout(r, 1000)); // 等待1秒
    
    const { stdout: cpuStdout2 } = await execPromise("cat /proc/stat | grep '^cpu ' | awk '{print ($2+$3+$4+$5+$6+$7+$8)}'");
    const { stdout: idleStdout2 } = await execPromise("cat /proc/stat | grep '^cpu ' | awk '{print $5}'");
    
    const total1 = parseInt(cpuStdout1.trim()) || 0;
    const idle1 = parseInt(idleStdout1.trim()) || 0;
    const total2 = parseInt(cpuStdout2.trim()) || 0;
    const idle2 = parseInt(idleStdout2.trim()) || 0;
    
    const totalDiff = total2 - total1;
    const idleDiff = idle2 - idle1;
    const cpuLoad = totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
    
    // 获取内存使用率（排除缓存）
    const { stdout: memStdout } = await execPromise("free | grep Mem | awk '{printf \"%.2f\", ($3-$7)/$2 * 100.0}'");
    const memLoad = parseFloat(memStdout.trim()) || 0;
    
    return { cpu: cpuLoad, memory: memLoad };
  } catch (e) {
    console.log('获取系统负载失败:', e.message);
    return { cpu: 0, memory: 0 };
  }
}

// 测试场景定义
const scenarios = [
  {
    name: '获取帖子列表',
    path: '/api/post/list',
    method: 'GET'
  },
  {
    name: '获取关注统计',
    path: '/api/social/follow-stats/1',
    method: 'GET'
  },
  {
    name: '搜索用户',
    path: '/api/auth/search?q=test',
    method: 'GET'
  }
];

// 运行压力测试
async function runLoadTest(concurrentUsers, scenario) {
  console.log(`\n🚀 开始测试: ${scenario.name}`);
  console.log(`👥 并发用户数: ${concurrentUsers}`);
  console.log(`⏱️  测试时长: ${TEST_DURATION}秒`);
  
  const result = await autocannon({
    url: BASE_URL + scenario.path,
    method: scenario.method,
    connections: concurrentUsers,
    duration: TEST_DURATION,
    pipelining: 1,
    bailout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return result;
}

// 主测试流程
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║           🚀 动物声音APP 压力测试开始                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  // 初始系统状态
  const initialLoad = await getSystemLoad();
  console.log(`\n📊 初始系统状态: CPU ${initialLoad.cpu.toFixed(1)}%, 内存 ${initialLoad.memory.toFixed(1)}%`);
  console.log(`⚠️  测试将在CPU或内存达到90%时自动停止\n`);
  
  const results = [];
  let maxUsers = 0;
  let stopTesting = false;
  
  // 逐步增加并发用户数 - 从50开始
  const userLevels = [50, 100, 200, 300, 500, 800, 1000, 1500, 2000];
  
  for (const concurrentUsers of userLevels) {
    if (stopTesting) break;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 测试级别: ${concurrentUsers} 并发用户`);
    console.log('='.repeat(60));
    
    // 检查系统负载
    const loadBefore = await getSystemLoad();
    console.log(`📊 测试前系统状态: CPU ${loadBefore.cpu.toFixed(1)}%, 内存 ${loadBefore.memory.toFixed(1)}%`);
    
    // 如果测试前负载已经很高，跳过
    if (loadBefore.cpu > 80 || loadBefore.memory > 85) {
      console.log(`⚠️ 系统负载已经很高，跳过此级别测试`);
      stopTesting = true;
      break;
    }
    
    const scenarioResults = [];
    
    for (const scenario of scenarios) {
      try {
        const result = await runLoadTest(concurrentUsers, scenario);
        
        // 等待系统稳定
        await new Promise(r => setTimeout(r, 3000));
        
        const loadAfter = await getSystemLoad();
        
        scenarioResults.push({
          scenario: scenario.name,
          requestsPerSecond: result.requests.average,
          latency: result.latency.average,
          errors: result.errors,
          timeouts: result.timeouts,
          cpuLoad: loadAfter.cpu,
          memoryLoad: loadAfter.memory,
          totalRequests: result.requests.total
        });
        
        console.log(`  ✅ 平均RPS: ${result.requests.average.toFixed(2)}`);
        console.log(`  ⏱️  平均延迟: ${result.latency.average.toFixed(2)}ms`);
        console.log(`  ❌ 错误数: ${result.errors}, 超时: ${result.timeouts}`);
        console.log(`  📊 总请求数: ${result.requests.total}`);
        console.log(`  🖥️  CPU: ${loadAfter.cpu.toFixed(1)}%, 内存: ${loadAfter.memory.toFixed(1)}%`);
        
        // 检查是否达到90%阈值
        if (loadAfter.cpu >= 90 || loadAfter.memory >= 90) {
          console.log(`\n🛑 系统负载达到90%阈值，停止测试！`);
          stopTesting = true;
          maxUsers = concurrentUsers;
          break;
        }
        
        // 错误率过高也停止
        const errorRate = result.errors / (result.requests.total || 1);
        if (errorRate > 0.05) { // 5%错误率
          console.log(`\n⚠️ 错误率过高 (${(errorRate * 100).toFixed(2)}%)，停止测试！`);
          stopTesting = true;
          maxUsers = concurrentUsers;
          break;
        }
        
        // 延迟过高也停止
        if (result.latency.average > 5000) { // 5秒延迟
          console.log(`\n⚠️ 平均延迟过高 (${result.latency.average.toFixed(0)}ms)，停止测试！`);
          stopTesting = true;
          maxUsers = concurrentUsers;
          break;
        }
      } catch (error) {
        console.log(`  ❌ 测试失败: ${error.message}`);
        stopTesting = true;
        maxUsers = concurrentUsers;
        break;
      }
    }
    
    if (scenarioResults.length > 0) {
      results.push({
        concurrentUsers,
        scenarios: scenarioResults
      });
    }
    
    if (!stopTesting) {
      maxUsers = concurrentUsers;
    }
    
    // 每轮测试后休息一下
    console.log(`\n⏸️  休息5秒...`);
    await new Promise(r => setTimeout(r, 5000));
  }
  
  // 输出测试报告
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                   📊 压力测试报告                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  console.log(`\n🎯 最大支撑并发请求数: ${maxUsers}`);
  
  if (results.length > 0) {
    console.log(`\n📈 各阶段测试结果:`);
    results.forEach(r => {
      console.log(`\n👥 ${r.concurrentUsers} 并发用户:`);
      r.scenarios.forEach(s => {
        console.log(`  ${s.scenario}:`);
        console.log(`    RPS: ${s.requestsPerSecond.toFixed(2)}`);
        console.log(`    延迟: ${s.latency.toFixed(2)}ms`);
        console.log(`    错误: ${s.errors}, 超时: ${s.timeouts}`);
        console.log(`    测试后CPU: ${s.cpuLoad.toFixed(1)}%, 内存: ${s.memoryLoad.toFixed(1)}%`);
      });
    });
    
    // 找出最佳性能点
    const bestResult = results.reduce((best, current) => {
      const currentRPS = current.scenarios.reduce((sum, s) => sum + s.requestsPerSecond, 0);
      const bestRPS = best.scenarios.reduce((sum, s) => sum + s.requestsPerSecond, 0);
      return currentRPS > bestRPS ? current : best;
    });
    
    console.log(`\n🏆 最佳性能点: ${bestResult.concurrentUsers} 并发用户`);
    const totalRPS = bestResult.scenarios.reduce((sum, s) => sum + s.requestsPerSecond, 0);
    console.log(`   总RPS: ${totalRPS.toFixed(2)}`);
    
    // 估算同时在线用户数
    console.log('\n📊 系统容量估算:');
    console.log(`  - 最大并发请求数: ${maxUsers}`);
    console.log(`  - 估算同时在线用户数: ${maxUsers * 3} ~ ${maxUsers * 5} (按每个用户3-5秒一次操作)`);
    console.log(`  - 估算日活跃用户(DAU): ${maxUsers * 10} ~ ${maxUsers * 20}`);
  } else {
    console.log('\n⚠️ 未能完成有效测试，系统负载已处于高位');
  }
  
  console.log('\n✅ 压力测试完成！');
}

main().catch(console.error);
