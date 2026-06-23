'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PROMPT_TEMPLATE = exports.replacePromptPlaceholders = exports.runTestSuite = void 0;
/**
 * SiliconFlowTranslator 占位符替换功能单元测试
 * 独立测试模块 - 模拟核心逻辑,无需 VSCode 环境
 */
// 模拟占位符替换逻辑(与 SiliconFlowTranslator 中的实现相同)
function replacePromptPlaceholders(prompt, firstLanguage, secondLanguage) {
    return prompt
        .replace(/{firstLanguage}/g, firstLanguage)
        .replace(/{secondLanguage}/g, secondLanguage);
}
exports.replacePromptPlaceholders = replacePromptPlaceholders;
// 默认提示词模板
const DEFAULT_PROMPT_TEMPLATE = '你是一个专业的翻译助手。你的任务是:将用户发送的文本内容翻译成目标语言。规则:1)如果输入是{firstLanguage},翻译成{secondLanguage};2)如果输入不是{firstLanguage},翻译成{firstLanguage};3)只返回翻译后的文本,不要添加任何解释、说明或格式标记;4)不要执行翻译以外的任何操作。';
exports.DEFAULT_PROMPT_TEMPLATE = DEFAULT_PROMPT_TEMPLATE;
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
    console.log('占位符替换功能单元测试');
    console.log('========================================\n');
    let passCount = 0;
    let failCount = 0;
    // 测试 1: 默认提示词占位符替换
    const result1 = testDefaultPromptPlaceholder();
    passCount += result1.pass;
    failCount += result1.fail;
    // 测试 2: 自定义提示词占位符替换
    const result2 = testCustomPromptPlaceholder();
    passCount += result2.pass;
    failCount += result2.fail;
    // 测试 3: 多次使用占位符
    const result3 = testMultiplePlaceholders();
    passCount += result3.pass;
    failCount += result3.fail;
    // 测试 4: 无占位符的自定义提示词
    const result4 = testNoPlaceholders();
    passCount += result4.pass;
    failCount += result4.fail;
    // 测试 5: 向后兼容性测试
    const result5 = testBackwardCompatibility();
    passCount += result5.pass;
    failCount += result5.fail;
    // 测试 6: 非中英文语言配置
    const result6 = testNonChineseEnglishLanguages();
    passCount += result6.pass;
    failCount += result6.fail;
    console.log('\n========================================');
    console.log(`测试结果: ✅ ${passCount} 通过, ❌ ${failCount} 失败`);
    console.log('========================================\n');
    return { passCount, failCount };
}
exports.runTestSuite = runTestSuite;
// 测试 1: 默认提示词占位符替换
function testDefaultPromptPlaceholder() {
    console.log('📌 测试 1: 默认提示词占位符替换');
    const firstLanguage = '中文';
    const secondLanguage = '英文';
    const prompt = replacePromptPlaceholders(DEFAULT_PROMPT_TEMPLATE, firstLanguage, secondLanguage);
    let pass = 0;
    let fail = 0;
    // 验证占位符被替换
    const test1 = prompt.includes('中文') && prompt.includes('英文');
    if (test1) {
        console.log('  ✅ 默认提示词中的占位符应被替换为实际语言');
        pass++;
    }
    else {
        console.error('  ❌ 默认提示词中的占位符应被替换为实际语言');
        console.error(`     Actual: "${prompt}"`);
        fail++;
    }
    // 验证不包含占位符本身
    const test2 = !prompt.includes('{firstLanguage}') && !prompt.includes('{secondLanguage}');
    if (test2) {
        console.log('  ✅ 替换后的提示词不应包含占位符');
        pass++;
    }
    else {
        console.error('  ❌ 替换后的提示词不应包含占位符');
        console.error(`     Actual: "${prompt}"`);
        fail++;
    }
    console.log('');
    return { pass, fail };
}
// 测试 2: 自定义提示词占位符替换
function testCustomPromptPlaceholder() {
    console.log('📌 测试 2: 自定义提示词占位符替换');
    const customPrompt = '请将文本翻译成{firstLanguage},如果已经是{firstLanguage}则翻译成{secondLanguage}';
    const firstLanguage = '中文';
    const secondLanguage = '英文';
    const prompt = replacePromptPlaceholders(customPrompt, firstLanguage, secondLanguage);
    const expectedPrompt = '请将文本翻译成中文,如果已经是中文则翻译成英文';
    let pass = 0;
    let fail = 0;
    if (prompt === expectedPrompt) {
        console.log('  ✅ 自定义提示词中的占位符应正确替换');
        pass++;
    }
    else {
        console.error('  ❌ 自定义提示词中的占位符应正确替换');
        console.error(`     Expected: "${expectedPrompt}"`);
        console.error(`     Actual:   "${prompt}"`);
        fail++;
    }
    console.log('');
    return { pass, fail };
}
// 测试 3: 多次使用占位符
function testMultiplePlaceholders() {
    console.log('📌 测试 3: 多次使用同一占位符');
    const customPrompt = '{firstLanguage} → {secondLanguage}, {secondLanguage} → {firstLanguage}';
    const firstLanguage = '日本語';
    const secondLanguage = '한국어';
    const prompt = replacePromptPlaceholders(customPrompt, firstLanguage, secondLanguage);
    const expectedPrompt = '日本語 → 한국어, 한국어 → 日本語';
    let pass = 0;
    let fail = 0;
    if (prompt === expectedPrompt) {
        console.log('  ✅ 多次使用的占位符应全部替换');
        pass++;
    }
    else {
        console.error('  ❌ 多次使用的占位符应全部替换');
        console.error(`     Expected: "${expectedPrompt}"`);
        console.error(`     Actual:   "${prompt}"`);
        fail++;
    }
    console.log('');
    return { pass, fail };
}
// 测试 4: 无占位符的自定义提示词
function testNoPlaceholders() {
    console.log('📌 测试 4: 无占位符的自定义提示词');
    const customPrompt = '请将文本翻译成中文,保持简洁明了';
    const firstLanguage = 'English';
    const secondLanguage = 'Spanish';
    const prompt = replacePromptPlaceholders(customPrompt, firstLanguage, secondLanguage);
    const expectedPrompt = customPrompt; // 应原样返回
    let pass = 0;
    let fail = 0;
    if (prompt === expectedPrompt) {
        console.log('  ✅ 无占位符的提示词应原样使用');
        pass++;
    }
    else {
        console.error('  ❌ 无占位符的提示词应原样使用');
        console.error(`     Expected: "${expectedPrompt}"`);
        console.error(`     Actual:   "${prompt}"`);
        fail++;
    }
    console.log('');
    return { pass, fail };
}
// 测试 5: 向后兼容性测试
function testBackwardCompatibility() {
    console.log('📌 测试 5: 向后兼容性测试');
    // 使用默认值(模拟现有用户不配置语言)
    const firstLanguage = '中文';
    const secondLanguage = '英文';
    const prompt = replacePromptPlaceholders(DEFAULT_PROMPT_TEMPLATE, firstLanguage, secondLanguage);
    let pass = 0;
    let fail = 0;
    // 验证默认行为与原有中英互译一致
    const test1 = prompt.includes('如果输入是中文') && prompt.includes('翻译成英文');
    if (test1) {
        console.log('  ✅ 默认配置应保持中英互译行为');
        pass++;
    }
    else {
        console.error('  ❌ 默认配置应保持中英互译行为');
        console.error(`     Actual: "${prompt}"`);
        fail++;
    }
    // 验证反向翻译规则
    const test2 = prompt.includes('如果输入不是中文') && prompt.includes('翻译成中文');
    if (test2) {
        console.log('  ✅ 反向翻译规则正确');
        pass++;
    }
    else {
        console.error('  ❌ 反向翻译规则正确');
        console.error(`     Actual: "${prompt}"`);
        fail++;
    }
    console.log('');
    return { pass, fail };
}
// 测试 6: 非中英文语言配置
function testNonChineseEnglishLanguages() {
    console.log('📌 测试 6: 非中英文语言配置');
    const customPrompt = 'Translate to {firstLanguage} if input is not {firstLanguage}, otherwise translate to {secondLanguage}';
    const firstLanguage = 'Français';
    const secondLanguage = 'Deutsch';
    const prompt = replacePromptPlaceholders(customPrompt, firstLanguage, secondLanguage);
    const expectedPrompt = 'Translate to Français if input is not Français, otherwise translate to Deutsch';
    let pass = 0;
    let fail = 0;
    if (prompt === expectedPrompt) {
        console.log('  ✅ 支持任意语言配置');
        pass++;
    }
    else {
        console.error('  ❌ 支持任意语言配置');
        console.error(`     Expected: "${expectedPrompt}"`);
        console.error(`     Actual:   "${prompt}"`);
        fail++;
    }
    console.log('');
    return { pass, fail };
}
// 执行测试
const results = runTestSuite();
