import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  globalThis.localStorage = {
    _data: {},
    getItem(key) {
      return this._data[key] || null;
    },
    setItem(key, value) {
      this._data[key] = value;
    },
    removeItem(key) {
      delete this._data[key];
    },
    clear() {
      this._data = {};
    }
  };

  globalThis.window = {};

  const storageMod = await import('./src/utils/storage.js');
  const { sessionsApi, draftsApi, bookingsApi, initDefaultData, STORAGE_KEYS, storage } = storageMod;

  const testFilePath = path.join(__dirname, 'src/utils/regressionTest.js');
  const testContent = fs.readFileSync(testFilePath, 'utf8');

  let testCode = testContent
    .replace(
      "import { sessionsApi, draftsApi, bookingsApi, initDefaultData, STORAGE_KEYS, storage } from './storage.js'",
      `
const sessionsApi = globalThis.__sessionsApi;
const draftsApi = globalThis.__draftsApi;
const bookingsApi = globalThis.__bookingsApi;
const initDefaultData = globalThis.__initDefaultData;
const STORAGE_KEYS = globalThis.__STORAGE_KEYS;
const storage = globalThis.__storage;
`
    )
    .replace(
      /^export async function runRegressionTests/gm,
      'async function runRegressionTests'
    )
    .replace(
      /^export function runQuickTest/gm,
      'function runQuickTest'
    )
    .replace(
      /if \(typeof window !== 'undefined'\) \{[\s\S]*?\n\}\s*$/,
      `
if (typeof module !== 'undefined') {
  module.exports = { runRegressionTests, runQuickTest };
}
`
    );

  globalThis.__sessionsApi = sessionsApi;
  globalThis.__draftsApi = draftsApi;
  globalThis.__bookingsApi = bookingsApi;
  globalThis.__initDefaultData = initDefaultData;
  globalThis.__STORAGE_KEYS = STORAGE_KEYS;
  globalThis.__storage = storage;

  const module = { exports: {} };
  globalThis.module = module;

  eval(testCode);

  const { runRegressionTests, runQuickTest } = module.exports;

  console.log('\n' + '='.repeat(60));
  console.log('🚀 开始运行快速验证测试');
  console.log('='.repeat(60) + '\n');

  try {
    runQuickTest();
  } catch (e) {
    console.error('快速测试运行失败:', e);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🧪 开始运行完整回归测试套件');
  console.log('='.repeat(60) + '\n');

  const result = await runRegressionTests();

  console.log('\n' + '='.repeat(60));
  console.log('📊 测试汇总报告');
  console.log('='.repeat(60));
  console.log(`总测试数: ${result.total}`);
  console.log(`通过: ${result.passed}`);
  console.log(`失败: ${result.total - result.passed}`);
  console.log(`整体结果: ${result.allPassed ? '✅ 全部通过' : '❌ 存在失败'}`);

  if (!result.allPassed) {
    console.log('\n❌ 失败详情:');
    result.results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`\n  ${r.id}: ${r.name}`);
        console.log(`  错误: ${r.error}`);
      });
  }

  console.log('='.repeat(60));

  process.exit(result.allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('测试运行失败:', err);
  process.exit(1);
});
