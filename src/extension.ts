import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

const HTML_MARKER_START = '<!-- RGB-EVERYWHERE-START -->';
const HTML_MARKER_END = '<!-- RGB-EVERYWHERE-END -->';
const JS_FILENAME = 'rgb-everywhere.js';

// Legacy markers for migration
const LEGACY_MARKER_START = '<!-- CHROMA-STATUSBAR-START -->';
const LEGACY_MARKER_END = '<!-- CHROMA-STATUSBAR-END -->';
const LEGACY_JS_FILENAME = 'chroma-statusbar.js';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('RGB Everywhere');
    log('Extension activating...');
    log(`App Root: ${vscode.env.appRoot}`);

    const injector = new ScriptInjector();

    // Show paths info
    const htmlPath = injector.getHtmlPath();
    log(`HTML Path: ${htmlPath || 'NOT FOUND'}`);

    // Register enable command
    const enableCommand = vscode.commands.registerCommand('rgb-everywhere.enable', async () => {
        outputChannel.show();
        log('Enable command executed');

        const result = await injector.inject();
        log(`Inject result: ${JSON.stringify(result)}`);

        if (result.success) {
            if (result.alreadyInjected) {
                vscode.window.showInformationMessage('RGB Everywhere: Already enabled. Restart VS Code if not visible.');
            } else {
                promptRestart('Rainbow effect enabled!');
            }
        } else {
            vscode.window.showErrorMessage(`RGB Everywhere: ${result.message}`);
        }
    });

    // Register disable command
    const disableCommand = vscode.commands.registerCommand('rgb-everywhere.disable', async () => {
        outputChannel.show();
        log('Disable command executed');

        const result = await injector.remove();
        log(`Remove result: ${JSON.stringify(result)}`);

        if (result.success) {
            promptRestart('Rainbow effect disabled!');
        } else {
            vscode.window.showErrorMessage(`RGB Everywhere: ${result.message}`);
        }
    });

    // Register status command for debugging
    const statusCommand = vscode.commands.registerCommand('rgb-everywhere.status', async () => {
        outputChannel.show();
        const htmlPath = injector.getHtmlPath();

        log('=== Status Check ===');
        log(`App Root: ${vscode.env.appRoot}`);
        log(`HTML Path: ${htmlPath || 'NOT FOUND'}`);

        if (htmlPath && fs.existsSync(htmlPath)) {
            const html = fs.readFileSync(htmlPath, 'utf8');
            const isInjected = html.includes(HTML_MARKER_START);
            log(`HTML File exists: YES`);
            log(`Script Injected: ${isInjected ? 'YES' : 'NO'}`);
            log(`HTML File size: ${html.length} bytes`);

            vscode.window.showInformationMessage(
                `RGB Everywhere: Script ${isInjected ? 'IS' : 'IS NOT'} injected. Check Output panel for details.`
            );
        } else {
            log(`HTML File exists: NO`);
            vscode.window.showErrorMessage('RGB Everywhere: HTML file not found!');
        }
    });

    // Auto-inject on first activation if enabled
    const config = vscode.workspace.getConfiguration('rgbEverywhere');
    if (config.get('enabled', true)) {
        log('Auto-inject enabled, attempting injection...');
        injector.inject().then(result => {
            log(`Auto-inject result: ${JSON.stringify(result)}`);
            if (!result.success && !result.alreadyInjected) {
                log(`Auto-inject failed: ${result.message}`);
            }
        }).catch(err => {
            log(`Auto-inject error: ${err}`);
        });
    }

    context.subscriptions.push(enableCommand, disableCommand, statusCommand, outputChannel);
    log('Extension activated');
}

function log(message: string) {
    const timestamp = new Date().toISOString();
    outputChannel.appendLine(`[${timestamp}] ${message}`);
    console.log(`[RGB Everywhere] ${message}`);
}

function promptRestart(message: string) {
    vscode.window.showInformationMessage(
        `RGB Everywhere: ${message} Restart VS Code to apply changes.`,
        'Restart Now',
        'Later'
    ).then(selection => {
        if (selection === 'Restart Now') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    });
}

export function deactivate() {
    log('Extension deactivating');
}

interface InjectionResult {
    success: boolean;
    message: string;
    alreadyInjected?: boolean;
}

class ScriptInjector {
    getHtmlPath(): string | null {
        const appRoot = vscode.env.appRoot;

        // Possible HTML file locations for different VS Code versions
        const possiblePaths = [
            path.join(appRoot, 'out', 'vs', 'code', 'electron-browser', 'workbench', 'workbench.html'),
            path.join(appRoot, 'out', 'vs', 'code', 'electron-sandbox', 'workbench', 'workbench.html'),
        ];

        for (const p of possiblePaths) {
            log(`Checking path: ${p}`);
            if (fs.existsSync(p)) {
                log(`Found HTML at: ${p}`);
                return p;
            }
        }

        return null;
    }

    private getProductJsonPath(): string {
        const appRoot = vscode.env.appRoot;
        return path.join(appRoot, 'product.json');
    }

    private computeChecksum(filePath: string): string {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(content).digest('base64').replace(/=+$/, '');
    }

    private getChecksumKey(htmlPath: string): string {
        const appRoot = vscode.env.appRoot;
        // Get relative path from appRoot/out
        const outPath = path.join(appRoot, 'out');
        const relativePath = path.relative(outPath, htmlPath);
        return relativePath.replace(/\\/g, '/');
    }

    private updateChecksum(htmlPath: string): void {
        try {
            const productJsonPath = this.getProductJsonPath();
            if (!fs.existsSync(productJsonPath)) {
                log('product.json not found, skipping checksum update');
                return;
            }

            const productJson = JSON.parse(fs.readFileSync(productJsonPath, 'utf8'));
            if (!productJson.checksums) {
                log('No checksums in product.json, skipping');
                return;
            }

            const checksumKey = this.getChecksumKey(htmlPath);
            const newChecksum = this.computeChecksum(htmlPath);

            log(`Updating checksum for ${checksumKey}: ${newChecksum}`);
            productJson.checksums[checksumKey] = newChecksum;

            fs.writeFileSync(productJsonPath, JSON.stringify(productJson, null, '\t'));
            log('Checksum updated successfully');
        } catch (error: any) {
            log(`Failed to update checksum: ${error.message}`);
        }
    }

    private getJsPath(htmlPath: string): string {
        return path.join(path.dirname(htmlPath), JS_FILENAME);
    }

    private getRainbowScript(): string {
        const config = vscode.workspace.getConfiguration('rgbEverywhere');
        const speed = config.get('animationSpeed', 2);
        // Convert speed (in seconds for full cycle) to hue increment per frame
        // At 50ms interval, we have 20 frames per second
        // For a 2-second cycle (360 degrees), we need 360/(2*20) = 9 degrees per frame
        const hueIncrement = Math.round(360 / (speed * 20));

        return `// RGB Everywhere Rainbow Effect
(function() {
    'use strict';

    let rgbInterval = null;
    let hue = 0;

    function startRainbow() {
        if (rgbInterval) return;

        rgbInterval = setInterval(() => {
            const items = document.querySelectorAll('.part.statusbar *');
            if (items.length === 0) return;

            hue = (hue + ${hueIncrement}) % 360;
            items.forEach((el, i) => {
                el.style.setProperty('color', 'hsl(' + ((hue + i * 10) % 360) + ', 100%, 50%)', 'important');
            });
        }, 50);
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(startRainbow, 1000);
        });
    } else {
        setTimeout(startRainbow, 1000);
    }

    console.log('RGB Everywhere: Rainbow script loaded');
})();
`;
    }

    private getScriptTag(): string {
        return `
${HTML_MARKER_START}
<script src="./${JS_FILENAME}"></script>
${HTML_MARKER_END}`;
    }

    private removeLegacyInjection(html: string, htmlPath: string): string {
        // Remove legacy CHROMA markers if present
        if (html.includes(LEGACY_MARKER_START)) {
            log('Found legacy CHROMA markers, removing...');
            const startIdx = html.indexOf(LEGACY_MARKER_START);
            const endIdx = html.indexOf(LEGACY_MARKER_END) + LEGACY_MARKER_END.length;
            if (startIdx !== -1 && endIdx > startIdx) {
                html = html.substring(0, startIdx).trimEnd() + '\n' + html.substring(endIdx).trimStart();
                log('Legacy markers removed from HTML');
            }
        }

        // Remove legacy JS file if present
        const legacyJsPath = path.join(path.dirname(htmlPath), LEGACY_JS_FILENAME);
        if (fs.existsSync(legacyJsPath)) {
            fs.unlinkSync(legacyJsPath);
            log('Legacy JS file removed');
        }

        return html;
    }

    async inject(): Promise<InjectionResult> {
        try {
            const htmlPath = this.getHtmlPath();

            if (!htmlPath) {
                return {
                    success: false,
                    message: 'Could not find VS Code HTML file. Check Output panel for details.'
                };
            }

            const jsPath = this.getJsPath(htmlPath);
            log(`JS Path: ${jsPath}`);

            log(`Reading HTML from: ${htmlPath}`);
            let html = fs.readFileSync(htmlPath, 'utf8');
            log(`HTML file size: ${html.length} bytes`);

            // Remove legacy injection if present
            html = this.removeLegacyInjection(html, htmlPath);

            // Check if already injected
            if (html.includes(HTML_MARKER_START)) {
                log('HTML already contains injection marker');
                return { success: true, message: 'Already injected', alreadyInjected: true };
            }

            // Create backup of HTML
            const backupPath = htmlPath + '.rgb-backup';
            if (!fs.existsSync(backupPath)) {
                log(`Creating HTML backup at: ${backupPath}`);
                fs.writeFileSync(backupPath, html);
            }

            // Write the JavaScript file
            const rainbowScript = this.getRainbowScript();
            log(`Writing JS file (${rainbowScript.length} bytes) to: ${jsPath}`);
            fs.writeFileSync(jsPath, rainbowScript);

            // Inject script tag before </body>
            const scriptTag = this.getScriptTag();
            html = html.replace('</body>', `${scriptTag}\n</body>`);

            log(`Writing modified HTML (${html.length} bytes) to: ${htmlPath}`);
            fs.writeFileSync(htmlPath, html);

            // Update checksum to prevent "corrupt installation" warning
            this.updateChecksum(htmlPath);

            // Verify write
            const verifyContent = fs.readFileSync(htmlPath, 'utf8');
            if (verifyContent.includes(HTML_MARKER_START)) {
                log('Script injection verified successfully');
                return { success: true, message: 'Script injected successfully' };
            } else {
                log('Script injection verification failed');
                return { success: false, message: 'Script injection verification failed' };
            }
        } catch (error: any) {
            log(`Injection error: ${error.message}`);
            log(`Error code: ${error.code}`);
            log(`Error stack: ${error.stack}`);

            if (error.code === 'EACCES' || error.code === 'EPERM') {
                return {
                    success: false,
                    message: `Permission denied. Run: sudo chown -R $(whoami) "${vscode.env.appRoot}"`
                };
            }
            return { success: false, message: `Error: ${error.message}` };
        }
    }

    async remove(): Promise<InjectionResult> {
        try {
            const htmlPath = this.getHtmlPath();

            if (!htmlPath) {
                return { success: false, message: 'Could not find VS Code HTML file' };
            }

            const jsPath = this.getJsPath(htmlPath);
            let html = fs.readFileSync(htmlPath, 'utf8');

            // Remove legacy injection if present
            html = this.removeLegacyInjection(html, htmlPath);

            const hasCurrentMarker = html.includes(HTML_MARKER_START);
            if (!hasCurrentMarker && !html.includes(LEGACY_MARKER_START)) {
                return { success: true, message: 'Script not present, nothing to remove' };
            }

            // Remove current injected script tag
            if (hasCurrentMarker) {
                const startIdx = html.indexOf(HTML_MARKER_START);
                const endIdx = html.indexOf(HTML_MARKER_END) + HTML_MARKER_END.length;

                if (startIdx !== -1 && endIdx > startIdx) {
                    html = html.substring(0, startIdx).trimEnd() + '\n' + html.substring(endIdx).trimStart();
                    log('Script tag removed successfully');
                }
            }

            fs.writeFileSync(htmlPath, html);

            // Update checksum to prevent "corrupt installation" warning
            this.updateChecksum(htmlPath);

            // Remove JS file
            if (fs.existsSync(jsPath)) {
                fs.unlinkSync(jsPath);
                log('JS file removed successfully');
            }

            return { success: true, message: 'Script removed successfully' };
        } catch (error: any) {
            log(`Remove error: ${error.message}`);
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                return {
                    success: false,
                    message: `Permission denied. Run: sudo chown -R $(whoami) "${vscode.env.appRoot}"`
                };
            }
            return { success: false, message: `Error: ${error.message}` };
        }
    }
}
