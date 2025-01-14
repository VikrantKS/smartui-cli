import { Context, Env, WebConfig, MobileConfig } from '../types.js'
import constants from './constants.js'
import { version } from '../../package.json'
import { validateConfig } from './schemaValidation.js'
import logger from './logger.js'
import getEnv from './env.js'
import httpClient from './httpClient.js'
import fs from 'fs'

export default (options: Record<string, string>): Context => {
    let env: Env = getEnv();
    let webConfig: WebConfig;
    let mobileConfig: MobileConfig;
    let config = constants.DEFAULT_CONFIG;

    try {
        if (options.config) {
            config = JSON.parse(fs.readFileSync(options.config, 'utf-8'));

            // resolutions supported for backward compatibility
            if (config.web?.resolutions) {
                config.web.viewports = config.web.resolutions;
                delete config.web.resolutions;
            }

            // validate config
            if (!validateConfig(config)) {
                throw new Error(validateConfig.errors[0].message);
            }
        }
    } catch (error: any) {
        console.log(`[smartui] Error: ${error.message}`);
        process.exit();
    }

    if (config.web) {
        webConfig = {browsers: config.web.browsers, viewports: []};
        for (let viewport of config.web?.viewports) webConfig.viewports.push({ width: viewport[0], height: viewport[1] || 0});
    }
    if (config.mobile) {
        mobileConfig = {
            devices: config.mobile.devices,
            fullPage: config.mobile.fullPage || true,
            orientation: config.mobile.orientation || constants.MOBILE_ORIENTATION_PORTRAIT,
        }
    }

    return {
        env: env,
        log: logger,
        client: new httpClient(env),
        config: {
            web: webConfig,
            mobile: mobileConfig,
            waitForPageRender: config.waitForPageRender || 0,
            waitForTimeout: config.waitForTimeout || 0,
            enableJavaScript: config.enableJavaScript || false,
            allowedHostnames: config.allowedHostnames || []
        },
        webStaticConfig: [],
        git: {
            branch: '',
            commitId: '',
            commitAuthor: '',
            commitMessage: '',
            githubURL: ''
        },
        build: {
            id: '',
            name: '',
            baseline: false,
            url: ''
        },
        args: {},
        options: {
            parallel: options.parallel ? true : false,
            markBaseline: options.markBaseline ? true : false,
            buildName: options.buildName || ''
        },
        cliVersion: version,
        totalSnapshots: -1
    }
}