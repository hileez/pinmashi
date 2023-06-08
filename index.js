const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron')
const path = require('path')
const { spawn, exec } = require('child_process');
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    minWidth: 1080,
    height: 740,
    minHeight: 740,
    webPreferences: {
      preload: path.join(__dirname, 'preload.min.js'),
      sandbox: false,
      webviewTag:true
    }
  })
  mainWindow.loadFile('./assets/pages/home.html')
  app.isPackaged ? "" : mainWindow.webContents.openDevTools()
}
const template = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建项目',
        accelerator: process.platform === 'darwin' ? 'Ctrl+N' : 'Ctrl+N',
        click: () => {
          mainWindow.webContents.send('new-project');
        }
      },
      {
        label: '打开项目',
        accelerator: process.platform === 'darwin' ? 'Ctrl+O' : 'Ctrl+O',
        click: () => {
          mainWindow.webContents.send('open-project');
        }
      },
      {
        label: '保存',
        accelerator: process.platform === 'darwin' ? 'Ctrl+S' : 'Ctrl+S',
        click: () => {
          mainWindow.webContents.send('save-project');
        }
      },
      {
        label: '另存为…',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Shift+S' : 'Ctrl+Shift+S',
        click: () => {
          mainWindow.webContents.send('save-project-as');
        }
      },
      {
        label: '导入模块',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Shift+I' : 'Ctrl+Shift+I',
        click: () => {
          mainWindow.webContents.send('event-relay', 'import-module');
          ipcMain.on('import-module', function (event, arg) {
            OpenBlockModule();
          });
        }
      },
      {
        label: '重命名项目',
        accelerator: process.platform === 'darwin' ? 'Ctrl+R' : 'Ctrl+R',
        click: () => {
          mainWindow.webContents.send('rename-project');
        }
      },
      {
        label: '退出',
        click: () => {
          mainWindow.webContents.send('exit-program');
        }
      }
    ]
  },
  {
    label: '设备',
    submenu: [
      {
        label: '连接',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Shift+L' : 'Ctrl+Shift+L',
        click: () => {
          mainWindow.webContents.send('device-connect');
        }
      },
      {
        label: '断开',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Shift+E' : 'Ctrl+Shift+E',
        click: () => {
          mainWindow.webContents.send('event-relay', 'conn-end');
          ipcMain.on('conn-end', function (event, arg) {
            conn.end();
          });
        }
      }
    ]
  },
  {
    label: '运行',
    submenu: [
      {
        label: '本地调试',
        accelerator: process.platform === 'darwin' ? 'F5' : 'F5',
        click: () => {
          mainWindow.webContents.send('run-local');
        }
      },
      {
        label: '设备调试',
        accelerator: process.platform === 'darwin' ? 'F6' : 'F6',
        click: () => {
          mainWindow.webContents.send('run-device');
        }
      },
      {
        label: '关闭调试',
        accelerator: process.platform === 'darwin' ? 'F7' : 'F7',
        click: () => {
          mainWindow.webContents.send('event-relay', 'device-debug-end');
          ipcMain.on('device-debug-end', function (event, arg) {
            if (connected.pids && connected.sftp) {
              device.DebugEnd(conn);
            }
          });
        }
      },
      {
        label: '清除调试控制台',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+C' : 'Alt+Shift+C',
        click: () => {
          mainWindow.webContents.send('clear-console');
        }
      }
    ]
  },
  {
    label: '终端',
    submenu: [
      {
        label: '新建终端',
        accelerator: process.platform === 'darwin' ? 'Ctrl+Shift+B' : 'Ctrl+Shift+B',
        click: () => {
          mainWindow.webContents.send('new-bash');
        }
      }
    ]
  },
  {
    label: '帮助',
    submenu: [
      {
        label: '学习交流QQ群',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "提示",
            message: "软件使用交流群、编程学习交流群：647165120",
            buttons: ["确定"]
          }).then((index) => { });
        }
      },
      {
        label: 'Github开源仓库',
        click: () => {
          exec('start https://github.com/supercoderlee/pinmashi');
        }
      },
      {
        label: '模块下载',
        click: () => {
          exec('start https://github.com/supercoderlee/pinmashi-resources');
        }
      },
      {
        label: '检查更新…',
        click: () => {
          UpdateCheck();
        }
      },
      {
        label: '关于',
        click: () => {
          dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "提示",
            message: "软件版本：1.0.0\n这是一个用图形化编程python的软件，集成远程开发调试等功能，采用可视化拖拽式积木编程，有效降低编程难度且能更直观理解程序逻辑。远程开发主要用在基于Linux操作系统的智能设备远程程序开发和调试。软件还结合物联网开发实现上位机和下位机的程序开发，实现物联网设备互联互通。本软件以GPL3开源协议发布在github和gitee上供大家学习和使用。",
            buttons: ["确定"]
          }).then((index) => { });
        }
      }
    ]
  },
]
Menu.setApplicationMenu(Menu.buildFromTemplate(template))
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
})
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
  mainWindow = null;
})
const fs = require('fs');
const compressing = require('compressing');
function ImportBlockModule(filename, callback = null) {
  compressing.zip.uncompress(filename, './temp').then(() => {
    let modulesPath = app.isPackaged ? 'resources/block_modules/modules.json' : './block_modules/modules.json';
    fs.readFile(modulesPath, 'utf8', (err, data) => {
      let module = JSON.parse(fs.readFileSync('./temp/module.json', 'utf8'));
      let modules = JSON.parse(data);
      let isExist = false;
      for (let index = 0; index < modules.length; index++) {
        let item = modules[index];
        if (item.name == module.name) {
          isExist = true;
          break;
        }
      }
      if (!isExist) {
        let modulePath = app.isPackaged ? `resources/block_modules/${module.name}` : `./block_modules/${module.name}`;
        fs.mkdir(modulePath, (err) => {
          compressing.zip.uncompress(filename, modulePath).then(() => {
            modules.push(module);
            fs.writeFile(modulesPath, JSON.stringify(modules), (err) => {
              if (callback) callback('');
            });
          }).catch(() => {
            console.log('解压失败')
          })
        });
      } else {
        if (callback) callback('module exist');
      }
    });
  }).catch(() => {
    console.log('解压失败')
  })
}
function OpenBlockModule() {
  dialog.showOpenDialog(mainWindow, {
    title: "导入模块",
    filters: [
      { name: 'Module', extensions: ['pbmd'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (result.filePaths.length > 0) {
      ImportBlockModule(result.filePaths[0], (err) => {
        let msg = '';
        if (!err) {
          mainWindow.webContents.send('load-modules-data');
          msg = '模块倒入成功'
        } else {
          msg = '模块倒入失败'
        }
        dialog.showMessageBox(mainWindow, {
          type: "warning",
          title: "提示",
          message: msg,
          buttons: ["确定"]
        }).then((index) => { });
      });
    }
  }).catch(err => {
    console.log(err)
  });
}
ipcMain.on('app-IsPackaged', function (event, arg) {
  event.returnValue = app.isPackaged;
});
ipcMain.on('app-quit', function (event, arg) {
  app.quit();
});
ipcMain.on('resend-renderer', function (event, arg) {
  event.sender.send(arg)
});
ipcMain.on('app-path', function (event, arg) {
  event.returnValue = app.getAppPath();
});
ipcMain.on('showOpenDialog', function (event, arg) {
  dialog.showOpenDialog(mainWindow, {
    title: "打开文件",
    filters: [
      { name: 'pms-project', extensions: ['pmsproj'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (result.filePaths.length > 0) {
      event.sender.send('opendialog-callback', result.filePaths[0]);
    }
  }).catch(err => {
    console.log(err)
  });
});
ipcMain.on('showSaveDialog', function (event, arg) {
  dialog.showSaveDialog(mainWindow, {
    title: "保存文件",
    defaultPath: arg,
    filters: [
      { name: 'pms-project', extensions: ['pmsproj'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (result.filePath) {
      event.sender.send('savedialog-callback', result.filePath);
    } else {
      event.sender.send('savedialog-callback', '');
    }
  }).catch(err => {
    console.log(err)
  });
});
ipcMain.on('local-python-run', function (event, arg) {
  if (process.platform == 'linux' || process.platform == 'darwin') {
    const process = spawn('bash', {
      detached: true
    });
  } else if (process.platform == 'win32') {
    let command = 'cmd /K python ';
    command += arg.debugCommand ? arg.debugCommand + ' ' : '';
    command += arg.filename + '\n';
    const process = spawn(command, {
      shell: true,
      detached: true
    });
  }
});
ipcMain.on('local-create-shell', function (event, arg) {
  if (process.platform == 'linux' || process.platform == 'darwin') {
  } else if (process.platform == 'win32') {
    const process = spawn('cmd', {
      shell: true,
      detached: true
    });
  }
});
ipcMain.on('open-link', (event, arg) => {
  exec(`start ${arg}`);
});
const { Client } = require('ssh2');
const conn = new Client();
connected = {
  host: null,
  port: null,
  username: null,
  password: null,
  sftp: null,
  stream: null,
  pids: []
}
conn.on('ready', () => {
  console.log('Client :: ready');
  mainWindow.webContents.send('device-reply', 'success');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    connected.sftp = sftp;
  });
});
conn.on('error', (err) => {
  console.log('Connection :: error :: ' + err);
  connected.sftp = null;
  connected.stream = null;
  connected.pids = [];
  conn.end();
  if (mainWindow) mainWindow.webContents.send('device-reply', 'error');
});
conn.on('end', () => {
  console.log('Connection :: end');
  connected.sftp = null;
  connected.stream = null;
  connected.pids = [];
  if (mainWindow) mainWindow.webContents.send('device-reply', 'end');
});
conn.on('close', (had_error) => {
  console.log('Connection :: close');
  connected.sftp = null;
  connected.stream = null;
  connected.pids = [];
  if (mainWindow) mainWindow.webContents.send('device-reply', 'close');
});
ipcMain.on('device-connect', function (event, data) {
  if (connected.sftp) conn.end();
  conn.connect(data);
  connected.host = data.host;
  connected.port = data.port;
  connected.username = data.username;
  connected.password = data.password;
});
ipcMain.on('device-close', function (event, data) {
  conn.end();
});
const device = require('./addons/device');
ipcMain.on('device-python-run', function (event, data) {
  if (connected.sftp) {
    let arr = data.filename.split('\\');
    let file = arr[arr.length - 1];
    let paths = {};
    paths.userdir = `/home/${connected.username}`;
    paths.exedirname = 'ev3-block';
    paths.executable = `${paths.userdir}/${paths.exedirname}/${file}`;
    connected.sftp.readdir(paths.userdir, (err, list) => {
      if (err) throw err;
      let isExist = false;
      for (let i = 0; i < list.length; i++) {
        let element = list[i];
        if (element.filename == paths.exedirname && element.longname.substring(0, 1) == 'd') {
          isExist = true;
          break;
        }
      }
      if (!isExist) {
        connected.sftp.mkdir(`${paths.userdir}/${paths.exedirname}`, (err) => {
          if (err) throw err;
          connected.sftp.fastPut(data.filename, paths.executable, (err) => {
            if (err) throw err;
            device.Debug(conn, event, data.debugCommand, paths.executable);
          });
        });
      } else {
        connected.sftp.fastPut(data.filename, paths.executable, (err) => {
          if (err) throw err;
          device.Debug(conn, event, data.debugCommand, paths.executable);
        });
      }
    });
  }
});
ipcMain.on('device-shell-write', function (event, data) {
  if (connected.stream) {
    connected.stream.write(`${data}\n`);
  }
});
ipcMain.on('device-shell-close', function (event, data) {
  if (connected.pids && connected.sftp) {
    device.DebugEnd(conn);
  }
});
OutputFilter = function (streamStr) {
  streamStr = streamStr.indexOf('chmod') > -1 ? '' : streamStr;
  streamStr = streamStr.indexOf('cd') > -1 ? '' : streamStr;
  streamStr = streamStr.indexOf('Last login') > -1 ? '' : streamStr;
  streamStr = streamStr.indexOf('###') > -1 ? '' : streamStr;
  streamStr = streamStr.indexOf(`${connected.username}@`) > -1 ? '' : streamStr;
  streamStr = streamStr.replace('[?2004l', '');
  streamStr = streamStr.replace('[?2004h', '');
  return streamStr;
}
const https = require('https');
const cheerio = require('cheerio');
function UpdateCheck() {
  let url = 'https://gitee.com/supercoderlee/pinmashi/releases';
  https.get(url, (response) => {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    });
    response.on('end', () => {
      var $ = cheerio.load(data);
      var version = $('.tag-name').attr('data-tag-name');
      console.log(version);
      if (version == 'v1.0.0') {
        dialog.showMessageBox(mainWindow, {
          type: "info",
          title: "提示",
          message: `当前 ${version} 为最新版本`,
          buttons: ["确定"]
        }).then((index) => { });
      } else {
        setTimeout(() => {
          dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "提示",
            message: `请更新到最新版本 ${version}`,
            buttons: ["确定"]
          }).then((index) => {
            exec('start https://github.com/supercoderlee/pinmashi/releases');
          });
        }, 1000);
      }
    });
  }).on('error', (error) => {
    setTimeout(() => {
      dialog.showMessageBox(mainWindow, {
        type: "info",
        title: "提示",
        message: "网络无法连接",
        buttons: ["确定"]
      }).then((index) => { });
    }, 1000);
  });
}
