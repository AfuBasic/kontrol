import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'resources/js');
const appEntry = path.join(sourceDir, 'app.tsx');
const formTags = new Set(['form', 'motion.form', 'Form']);
const failures = [];
let formCount = 0;

for (const file of collectTsxFiles(sourceDir)) {
    const text = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    visit(sourceFile, (node) => {
        if (!ts.isJsxOpeningElement(node)) {
            return;
        }

        const tagName = node.tagName.getText(sourceFile);

        if (!formTags.has(tagName)) {
            return;
        }

        formCount += 1;

        const hasNoValidate = node.attributes.properties.some(
            (attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText(sourceFile) === 'noValidate',
        );

        if (!hasNoValidate) {
            const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            failures.push(`${path.relative(rootDir, file)}:${location.line + 1}:${location.character + 1} is missing noValidate`);
        }
    });
}

const appSource = fs.readFileSync(appEntry, 'utf8');

if (!appSource.includes("import { initMobileFormValidation } from './Utils/mobileFormValidation';")) {
    failures.push('resources/js/app.tsx does not import initMobileFormValidation');
}

if (!appSource.includes('initMobileFormValidation();')) {
    failures.push('resources/js/app.tsx does not initialize mobile form validation');
}

if (failures.length > 0) {
    console.error('Native form validation guard failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}

console.log(`Verified ${formCount} form components use noValidate and shared mobile validation is initialized.`);

function collectTsxFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            return collectTsxFiles(fullPath);
        }

        return entry.isFile() && entry.name.endsWith('.tsx') ? [fullPath] : [];
    });
}

function visit(node, callback) {
    callback(node);
    node.forEachChild((child) => visit(child, callback));
}
