import { app, shell, ipcMain, Menu, BrowserWindow, PopupOptions } from 'electron';
import serve from 'electron-serve';
import { MenuItemConstructorOptions } from 'electron/main';
import { createWindow } from './helpers';

const isProd: boolean = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1280,
    height: 720,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    useContentSize: true
  });

  const handleUrlOpen = (e, url: string)=>{
    const port = process.argv[2];
    if(url.indexOf(`http://localhost:${port}`) != 0 && url.indexOf('app') != 0){
      e.preventDefault()
      shell.openExternal(url)
    }
  }
  mainWindow.webContents.on('will-navigate', handleUrlOpen);
  mainWindow.webContents.on('new-window', handleUrlOpen);

  if (isProd) {
    await mainWindow.loadURL('app://./home.html');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
  }
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('show-context-menu', (event) => {
  const template: Array<MenuItemConstructorOptions> =
  [
    {
      label: 'Copy',
      role: 'copy',
      click: () => {
        console.log('fug')
        event.sender.send('context-menu-command', 'menu-item-1')
      }
    },
    {
      label: 'Paste',
      role: 'paste',
      click: () => {
        console.log('fug')
        event.sender.send('context-menu-command', 'menu-item-1')
      }
    },
  ]
  const menu = Menu.buildFromTemplate(template)
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup({window: win})
})
