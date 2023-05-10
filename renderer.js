/*
 * @Description: PinMaShi renderer javascript
 * @Author: ZhenLi
 * @Date: 2022-10-06 21:49:41
 * @LastModifiedBy: ZhenLi
 * @LastEditTime: 2022-10-28 02:00:10
 */

function PromptModal(title, message, defaultValue, callback) {
    document.getElementById('promptModalLabel').innerHTML = title;
    document.getElementById('promptModalMessage').innerHTML = message;
    document.getElementById('promptModalValue').value = defaultValue;
    $('#promptModal').modal('show');
    document.getElementById('promptModalOk').onclick = () => {
        // 回调函数
        callback(document.getElementById('promptModalValue').value);
    };

    document.getElementById('promptModalValue').onkeydown = (event) => {
        if (event.keyCode == 13) {
            // 回车回调函数
            callback(document.getElementById('promptModalValue').value);
            $('#promptModal').modal('hide');
            return false; // 不返回flase页面将会重载
        }
    };
}

function MultePromptModal(title, inputs, callback) {
    document.getElementById('multePromptModalLabel').innerHTML = title;
    document.getElementById('mainform').innerHTML = '';
    inputs.forEach((input, index) => {
        let inputDiv = `<div class="mb-3">
                    <label for="recipient-name" class="col-form-label">${input.label}:</label>
                    <input type="text" class="form-control" id="multePromptModalValue-${index}" value="${input.value}">
                </div>`;
        document.getElementById('mainform').insertAdjacentHTML('beforeend', inputDiv);
        // 回车确定
        document.getElementById(`multePromptModalValue-${index}`).onkeydown = (event) => {
            if (event.keyCode == 13) {
                // 回车回调函数
                let arrValue = [];
                inputs.forEach((input, index) => {
                    arrValue.push(document.getElementById('multePromptModalValue-' + index).value);
                });
                // 回调函数
                callback(arrValue);
                $('#multePromptModal').modal('hide');
                return false; // 不返回flase页面将会重载
            }
        };
    });
    $('#multePromptModal').modal('show');
    document.getElementById('multePromptModalOk').onclick = () => {
        let arrValue = [];
        inputs.forEach((input, index) => {
            arrValue.push(document.getElementById('multePromptModalValue-' + index).value);
        });
        // 回调函数
        callback(arrValue);
    };
}

function ConfirmModal(title, message, callback = null) {
    document.getElementById('confirmModalLabel').innerHTML = title;
    document.getElementById('confirmModalMessage').innerHTML = message;
    $('#confirmModal').modal('show');
    document.getElementById('confirmModalOk').onclick = () => {
        if (callback) {
            // 回调函数
            callback();
        }
    };
}

function AlertModal(title, message, callback = null) {
    document.getElementById('alertModalLabel').innerHTML = title;
    document.getElementById('alertModalMessage').innerHTML = message;
    $('#alertModal').modal('show');
    document.getElementById('alertModalOk').onclick = () => {
        if (callback) {
            // 回调函数
            callback();
        }
    };
}

let appIsPackaged = ipcRendererApi.sendSync('app-IsPackaged', '');

ipcRendererApi.on('event-relay', (event, eventName) => {
    ipcRendererApi.send(eventName);
});



let publicData = {
    project: {
        name: "",
        module: "",
        filename: "",
        isSave: 0, 
    },
    device: {
        host: '', 
        isShell: 0
    },
    module: {
        toolbox: null, 
        debugCommand: null, 
        headCode: [] 
    }
};


let blocklyWorkspace = null;

publicData.project.name = 'demo';
publicData.project.filename = '';
publicData.project.isSave = 0;
ChangeTitle();

LoadModulesData();

function LoadModulesData() {
    let modulesPath = appIsPackaged ? 'resources/block_modules/modules.json' : './block_modules/modules.json';
    fsApi.readFile(modulesPath, 'utf8', function (err, data) {
        if (err == null) {
            document.getElementById('card-list').innerHTML = '';
            blocklyModules = JSON.parse(data.toString());
            blocklyModules.forEach(module => {
                let moduleItemPath = appIsPackaged ? `../block_modules/${module.name}` : `./block_modules/${module.name}`;
                let card = `<div class="col"><a class="card-link" href="javascript:CreateProject('${moduleItemPath}/${module.main}');">
                                            <div class="card h-100"><img class="card-img-top w-100 d-block fit-cover" style="height: 200px;" src="${moduleItemPath}/img.jpg">
                                                <div class="card-body p-4">
                                                    <h4 class="card-title">${module.title}</h4>
                                                    <p class="card-text">${module.description}</p>
                                                    <div class="card-icon"><i class="fas fa-plus-circle"></i></div>
                                                </div>
                                            </div>
                                        </a></div>`;
                document.getElementById('card-list').insertAdjacentHTML('beforeend', card);
            });
            if (!publicData.project.module) {
                let modulePath = appIsPackaged ? `../block_modules/${blocklyModules[0].name}/${blocklyModules[0].main}` : `./block_modules/${blocklyModules[0].name}/${blocklyModules[0].main}`;
                LoadWorkSpace(modulePath);
            }
        } else {
            console.log("readFile error:" + err);
        }
    });
}

ipcRendererApi.on('load-modules-data', (event, data) => {
    LoadModulesData();
});

var myCodeMirror = CodeMirror.fromTextArea(document.getElementById("textarea-code"), {
    mode: "python",
    // theme: "dracula",
    keyMap: "sublime",
    lineNumbers: true,
    smartIndent: true,
    indentUnit: 4,
    indentWithTabs: true,
    lineWrapping: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    foldGutter: true,
    autofocus: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    styleActiveLine: true
});
myCodeMirror.on("keypress", function () {
    myCodeMirror.showHint();
});

function CreateProject(module) {
    $('#homeModal').modal('hide');
    PromptModal('请输入', '项目名称', '', (data) => {
        if (data != '') {
            publicData.project.name = data;
            publicData.project.filename = '';
            publicData.project.isSave = 0;
            ChangeTitle();
            LoadWorkSpace(module);
        }
    });
}

Blockly.Themes.NewTheme = Blockly.Theme.defineTheme('halloween', {
    'base': Blockly.Themes.Classic,
    'componentStyles': {
        'workspaceBackgroundColour': '#ffffff',
        'toolboxBackgroundColour': '#f5f5f5',
        'toolboxForegroundColour': '#969696',
        'flyoutBackgroundColour': '#e9e9ee',
        'flyoutForegroundColour': '#0000ff',
        'flyoutOpacity': 0.8,
        'scrollbarColour': '#dadada',
        'insertionMarkerColour': '#fff',
        'insertionMarkerOpacity': 0.3,
        'scrollbarOpacity': 0.4,
        'cursorColour': '#d0d0d0',
        'blackBackground': '#333'
    }
});

function LoadWorkSpace(module, workSpaceData = {}) {
    publicData.module.debugCommand = null;
    blockApi.LoadModules(module, () => {
        publicData.project.module = module;
        publicData.module.headCode = [];
        document.getElementById('blockly-workspace').innerHTML = '';
        document.getElementById('textarea-code').value = '';

        blocklyWorkspace = Blockly.inject('blockly-workspace', {
            media: './assets/blockly/media/',
            toolbox: publicData.module.toolbox,
            sounds: true,
            scrollbars: true,
            trashcan: false,
            zoom: {
                controls: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2,
                pinch: true
            },
            grid: {
                spacing: 20,
                length: 1.2,
                colour: '#ccc',
                snap: true
            },
            theme: Blockly.Themes.NewTheme
        });
        Blockly.serialization.workspaces.load(workSpaceData, blocklyWorkspace);
        blocklyWorkspace.addChangeListener((event) => {
            if (event.type == Blockly.Events.BLOCK_DELETE) {
                DelHeadCode();
            }
            var code = Blockly.Python.workspaceToCode(blocklyWorkspace);
            let headCode = '';
            publicData.module.headCode.forEach(element => {
                headCode += `${element.value}\n`;
            });
            code = headCode ? `${headCode}\n${code}` : code;
            document.getElementById('textarea-code').value = code;
            myCodeMirror.setValue(code);
            publicData.project.isSave = 0;
        });
    });
}

Blockly.prompt = (message, defaultValue, callback) => {
    PromptModal('请输入', message, defaultValue, (data) => {
        if (data) callback(data);
    });
};




ipcRendererApi.on('new-project', (event, data) => {
    if (publicData.project.isSave == 0) {
        ConfirmModal('提示', '当前项目未保存，确定要新建项目吗？', () => {
            $('#homeModal').modal('show');
        });
    } else {
        $('#homeModal').modal('show');
    }
});

ipcRendererApi.on('open-project', (event, data) => {
    if (publicData.project.isSave == 0) {
        ConfirmModal('提示', '当前项目未保存，确定要打开项目吗？', () => {
            LoadProjectFile();
        });
    } else {
        LoadProjectFile();
    }
});

ipcRendererApi.on('save-project', (event, data) => {
    if (publicData.project.filename == '') {
        ipcRendererApi.send('showSaveDialog', publicData.project.name);
        ipcRendererApi.once('savedialog-callback', (event, filename) => {
            if (filename) {
                SaveProjectFile(filename);
            }
        });
    } else {
        SaveProjectFile(publicData.project.filename);
    }
});

ipcRendererApi.on('save-project-as', (event, data) => {
    ipcRendererApi.send('showSaveDialog', publicData.project.name);
    ipcRendererApi.once('savedialog-callback', (event, filename) => {
        if (filename) {
            SaveProjectFile(filename);
        }
    });
});

ipcRendererApi.on('rename-project', (event, data) => {
    PromptModal('请输入', '项目名称', publicData.project.name, (data) => {
        if (data) {
            if (publicData.project.filename) {
                fsApi.unlink(publicData.project.filename, () => { })
                fsApi.unlink(GetPyFileName(publicData.project.filename), () => { })
                publicData.project.filename = publicData.project.filename.replace(`${publicData.project.name}.pmsproj`, `${data}.pmsproj`);
                SaveProjectFile(publicData.project.filename);
            }
            publicData.project.name = data;
            ChangeTitle();
        }
    });
});

ipcRendererApi.on('exit-program', (event, data) => {
    if (publicData.project.isSave == 0) {
        ConfirmModal('提示', '当前项目未保存，确定要退出程序吗？', () => {
            ipcRendererApi.send('app-quit');
        });
    } else {
        ConfirmModal('提示', '确定要退出程序吗？', () => {
            ipcRendererApi.send('app-quit');
        });
    }
});

ipcRendererApi.on('device-connect', (event, data) => {
    MultePromptModal("连接设备", [
        { label: "设备IP", value: "" },
        { label: "用户名", value: "robot" },
        { label: "密码", value: "maker" },
        { label: "端口（默认是22）", value: "22" }
    ], (data) => {
        if (data) {
            let reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
            if (reg.test(data[0])) {
                publicData.device.host = data[0];
                ipcRendererApi.send('device-connect', {
                    host: data[0],
                    port: data[3],
                    username: data[1],
                    password: data[2]
                });
            } else {
                AlertModal('提示', 'IP输入错误，请重新输入！', () => {
                    ipcRendererApi.send('resend-renderer', 'device-connect');
                });
            }
        }
    });


});

ipcRendererApi.on('run-local', (event, data) => {
    if (publicData.project.filename == '') {
        ipcRendererApi.send('showSaveDialog', publicData.project.name);
        ipcRendererApi.once('savedialog-callback', (event, filename) => {
            if (filename) {
                SaveProjectFile(filename);
                ipcRendererApi.send('local-python-run', {
                    debugCommand: publicData.module.debugCommand,
                    filename: GetPyFileName(filename)
                });
            }
        });
    } else {
        SaveProjectFile(publicData.project.filename);
        ipcRendererApi.send('local-python-run', {
            debugCommand: publicData.module.debugCommand,
            filename: GetPyFileName(publicData.project.filename)
        });
    }
});

ipcRendererApi.on('run-device', (event, data) => {
    if (!publicData.device.host) {
        ConfirmModal('提示', '未连接设备无法调试，确定要连接设备吗？', () => {
            ipcRendererApi.send('resend-renderer', 'device-connect');
        });
        return;
    }
    if (publicData.device.isShell) return;
    if (publicData.project.filename == '') {
        ipcRendererApi.send('showSaveDialog', publicData.project.name);
        ipcRendererApi.once('savedialog-callback', (event, filename) => {
            if (filename) {
                SaveProjectFile(filename);
                ipcRendererApi.send('device-python-run', {
                    debugCommand: publicData.module.debugCommand,
                    filename: GetPyFileName(filename)
                });
                publicData.device.isShell = 1;
            }
        });
    } else {
        SaveProjectFile(publicData.project.filename);
        ipcRendererApi.send('device-python-run', {
            debugCommand: publicData.module.debugCommand,
            filename: GetPyFileName(publicData.project.filename),
        });
        publicData.device.isShell = 1;
    }
    outputData = [];
    document.getElementById('output-shell').value = '';
});

ipcRendererApi.on('clear-console', (event, data) => {
    outputData = []; //清空控制台输出缓存数组
    document.getElementById('output-shell').value = '';
});

ipcRendererApi.on('new-bash', (event, data) => {
    ipcRendererApi.send('local-create-shell');
});

ipcRendererApi.on('about-program', (event, data) => {
    AlertModal('关于',
        `<p>软件版本：1.0.0</p>
    <p>软件版权：本软件版权归作者所有，禁止任何人组织机构用于商业用途。</p>
    <p>软件简介：本软件是为智能设备编程而制作的程序开发编辑器，采用可视化拖拽式积木结合实际代码编程，有效降低编程难度且能更直观理解程序逻辑。软件主要用途是为基于Linux操作系统的智能设备进行远程开发和调试，
    通过软件能快速编程并在远程设备上执行和交互。另外软件还结合物联网开发实现上位机下位机的程序开发，实现物联网设备互联互通。</p>`
    );
});

document.getElementById('input-shell').onkeydown = (event) => {
    if (event.keyCode == 13) {
        // 回车发送内容
        let element = document.getElementById('input-shell');
        ipcRendererApi.send('device-shell-write', element.value);
        element.value = '';
    }
};



ipcRendererApi.on('device-reply', (event, data) => {
    switch (data) {
        case 'success':
            data = '设备已连接\n';
            publicData.device.isShell = 0;
            ChangeTitle();
            break;
        case 'error':
            data = '设备连接错误\n';
            publicData.device.host = '';
            publicData.device.isShell = 0;
            ChangeTitle();
            break;
        case 'end':
            data = '设备连接结束\n';
            publicData.device.host = '';
            publicData.device.isShell = 0;
            ChangeTitle();
            break;
        case 'close':
            data = '设备已关闭\n';
            publicData.device.host = '';
            publicData.device.isShell = 0;
            ChangeTitle();
            break;
        case 'shell_created':
            data = '设备开始调试\n';
            publicData.device.isShell = 1;
            break;
        case 'shell_closed':
            data = '设备停止调试\n';
            publicData.device.isShell = 0;
            break;
        default:
            break;
    }
    outputData.push(data);
});

let outputData = [];
setInterval(() => {
    let dataCount = outputData.length;
    if (dataCount) {
        data = outputData.join('');
        let element = document.getElementById('output-shell');
        element.value = data
        element.scrollTop = element.scrollHeight;
        if (dataCount > 50) outputData = [];
    }
}, 100);

function LoadProjectFile() {
    ipcRendererApi.send('showOpenDialog', '');
    ipcRendererApi.once('opendialog-callback', (event, filename) => {
        fsApi.readFile(filename, 'utf8', function (err, data) {
            let saveData = JSON.parse(data);
            let modulesPath = appIsPackaged ? 'resources/block_modules/modules.json' : './block_modules/modules.json';
            fsApi.readFile(modulesPath, 'utf8', function (err, data) {
                if (err) throw err;
                blocklyModules = JSON.parse(data.toString());
                let arr = saveData.module.split('/');
                let moduleName = arr[arr.length - 2];
                let isExist = false;
                for (let index = 0; index < blocklyModules.length; index++) {
                    let item = blocklyModules[index];
                    if (item.name == moduleName) {
                        isExist = true;
                        break;
                    }
                }
                if (isExist) {
                    publicData.project.name = saveData.name;
                    publicData.project.filename = filename;
                    publicData.project.isSave = 1;
                    LoadWorkSpace(saveData.module, saveData.workspaces);
                    ChangeTitle();
                } else {
                    AlertModal('提示', `缺少 ${moduleName} 模块，无法打开项目，请导入该模块后再试！`);
                }
            });
        });
    });
}

function SaveProjectFile(filename) {
    let arr = filename.split('\\');
    let projectName = arr[arr.length - 1].replace('.pmsproj', '');
    let saveData = {
        name: projectName,
        module: publicData.project.module,
        workspaces: Blockly.serialization.workspaces.save(blocklyWorkspace)
    };
    fsApi.writeFile(filename, JSON.stringify(saveData), (err) => {
        if (err == null) {
            publicData.project.name = projectName;
            publicData.project.filename = filename;
            publicData.project.isSave = 1;
            ChangeTitle();
        } else {
            console.log("写入失败：" + err);
        }
    });
    fsApi.writeFile(GetPyFileName(filename), myCodeMirror.getValue(), (err) => { });
}

function GetPyFileName(filename) {
    return filename.substring(0, filename.length - 8) + '.py';
}

function ChangeTitle() {
    let title = publicData.project.name;
    title += publicData.device.host ? ` - 已连接${publicData.device.host}设备` : '';
    title += ' - PinMaShi';
    document.title = title;
}

function AddHeadCode(codeName, codeValue, blockType, isTop = 0) {
    let isExist = publicData.module.headCode.every(element => {
        if (element.name == codeName) {
            if (element.types.indexOf(blockType) < 0) {
                element.types.push(blockType);
                element.value = codeValue;
            }
            return false;
        }
        return true;
    });
    if (isExist) {
        if (isTop) {
            publicData.module.headCode.unshift({ name: codeName, value: codeValue, types: [blockType] });
        } else {
            publicData.module.headCode.push({ name: codeName, value: codeValue, types: [blockType] });
        }
    }
}

function DelHeadCode() {
    for (let i = 0; i < publicData.module.headCode.length; i++) {
        let element = publicData.module.headCode[i];
        for (let t = 0; t < element.types.length; t++) {
            let type = element.types[t];
            if (!(type in blocklyWorkspace.typedBlocksDB_)) {
                element.types.splice(t, 1);
                t--;
            }
        }
        if (!element.types.length) {
            publicData.module.headCode.splice(i, 1);
            i--;
        }
    }
}