import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4kjsaFaJIAOasJYoxNqcfIdoO4w/0IjrECIoC9lc32SRoBeu7q/+iyViclAaeeeNSjrjd0h+/fGfcgWTgSpQuHhsub88MxzyzTz8mQpDS8DZcX4aps4NTOXBF0DWhgBh7iGJqDDT8lYQGyX321iON7ULKE5/2zwXt7LAHEIrhG+7t/RujufgCEIMXOk8bI6E798Ar2Da2vbG/Dq+OEvNDImScOQUr8LCBUrQkbKDf3zyqeljkaz/DYXrbiqW4CWwF36LAnyogArax00eXmFeNdStHhKSxDJFk+bzfYNlQ+K70/ALEwIpBx7OVGNieQDn2mhMPWM5W0pukx4aKoVqIwIDAQAB',
    permissions: ['identity', 'tabs', 'scripting', 'activeTab', 'storage'],
    host_permissions: ['*://*.prologistics.info/*'],
    oauth2: {
      client_id: '620476405318-l5rhlmosiumfh3i514o0dg9ip8u30ole.apps.googleusercontent.com',
      scopes: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
    },
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (wxt.config.mode === 'development') {
        // add (DEV) suffix to extension's name in dev mode
        manifest.name += ' (DEV)';
      }
    },
  },
  webExt: {
    disabled: true, // toggle if needed
    startUrls: ['https://prologistics.info', 'https://prolodev.prologistics.info'],
  },
});
