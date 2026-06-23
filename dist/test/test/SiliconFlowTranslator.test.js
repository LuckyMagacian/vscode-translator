'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const SiliconFlowTranslator_1 = require("../src/translators/SiliconFlowTranslator");
/**
 * SiliconFlowTranslator 占位符替换功能单元测试
 * 独立测试模块 - 无需 VSCode 环境
 */
// 测试工具函数
function assertEqual(actual, expected, testName) {
    if (actual === expected) {
        console.log(`✅ PASS: ${testName}`);
    }
    else {
        console.error(`❌ FAIL: ${testName}`);
        console.error(`   Expected: "${expected}"`);
        console.error(`   Actual:   "${actual}"`);
    }
}
function runTestSuite() {
    console.log('\n========================================');
    console.log('SiliconFlowTranslator 占位符替换测试');
    console.log('========================================\n');
    // 测试 1: 默认提示词占位符替换
    testDefaultPromptPlaceholder();
    // 测试 2: 自定义提示词占位符替换
    testCustomPromptPlaceholder();
    // 测试 3: 多次使用占位符
    testMultiplePlaceholders();
    // 测试 4: 无占位符的自定义提示词
    testNoPlaceholders();
    // 测试 5: 向后兼容性测试
    testBackwardCompatibility();
    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================\n');
}
// 测试 1: 默认提示词占位符替换
function testDefaultPromptPlaceholder() {
    console.log('📌 测试 1: 默认提示词占位符替换');
    const translator = new SiliconFlowTranslator_1.SiliconFlowTranslator('test-api-key', 'test-model', 'https://test.api', undefined, // 不提供自定义提示词,使用默认
    '中文', '英文');
    // 通过反射获取 systemPrompt (测试目的)
    const prompt = translator.systemPrompt;
    // 验证占位符被替换
    assertEqual(prompt.includes('中文') && prompt.includes('英文'), true, '默认提示词中的占位符应被替换为实际语言');
    // 验证不包含占位符本身
    assertEqual(!prompt.includes('{firstLanguage}') && !prompt.includes('{secondLanguage}'), true, '替换后的提示词不应包含占位符');
    console.log('');
}
// 测试 2: 自定义提示词占位符替换
function testCustomPromptPlaceholder() {
    console.log('📌 测试 2: 自定义提示词占位符替换');
    const customPrompt = '请将文本翻译成{firstLanguage},如果已经是{firstLanguage}则翻译成{secondLanguage}';
    const translator = new SiliconFlowTranslator_1.SiliconFlowTranslator('test-api-key', 'test-model', 'https://test.api', customPrompt, '中文', '英文');
    const prompt = translator.systemPrompt;
    const expectedPrompt = '请将文本翻译成中文,如果已经是中文则翻译成英文';
    assertEqual(prompt, expectedPrompt, '自定义提示词中的占位符应正确替换');
    console.log('');
}
// 测试 3: 多次使用占位符
function testMultiplePlaceholders() {
    console.log('📌 测试 3: 多次使用同一占位符');
    const customPrompt = '{firstLanguage} → {secondLanguage}, {secondLanguage} → {firstLanguage}';
    const translator = new SiliconFlowTranslator_1.SiliconFlowTranslator('test-api-key', 'test-model', 'https://test.api', customPrompt, '日本語', '한국어');
    const prompt = translator.systemPrompt;
    const expectedPrompt = '日本語 → 한국어, 한국어 → 日本語';
    assertEqual(prompt, expectedPrompt, '多次使用的占位符应全部替换');
    console.log('');
}
// 测试 4: 无占位符的自定义提示词
function testNoPlaceholders() {
    console.log('📌 测试 4: 无占位符的自定义提示词');
    const customPrompt = '请将文本翻译成中文,保持简洁明了';
    const translator = new SiliconFlowTranslator_1.SiliconFlowTranslator('test-api-key', 'test-model', 'https://test.api', customPrompt, 'English', // 即使配置了不同语言
    'Spanish');
    const prompt = translator.systemPrompt;
    const expectedPrompt = customPrompt; // 应原样返回
    assertEqual(prompt, expectedPrompt, '无占位符的提示词应原样使用');
    console.log('');
}
// 测试 5: 向后兼容性测试
function testBackwardCompatibility() {
    console.log('📌 测试 5: 向后兼容性测试');
    // 使用默认参数(模拟现有用户不配置语言)
    const translator = new SiliconFlowTranslator_1.SiliconFlowTranslator('test-api-key', 'test-model', 'https://test.api', undefined
    // 不提供 firstLanguage 和 secondLanguage,使用默认值
    );
    const prompt = translator.systemPrompt;
    // 验证默认行为与原有中英互译一致
    assertEqual(prompt.includes('中文') && prompt.includes('英文'), true, '默认配置应保持中英互译行为');
    console.log('');
}
// 执行测试
runTestSuite();
