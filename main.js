const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');

// Função para criar a janela do Electron
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, 'assets/icon.ico'),
    });
    // Abre a URL do servidor backend
    win.loadURL('http://localhost:3000');
}



// Inicie o servidor Express junto com o app do Electron
app.whenReady().then(() => {
    // Inicialize o servidor rodando o `server.js` em um processo separado
    const serverProcess = fork(path.join(__dirname, "src", 'index.js'));

    // Aguarde um pequeno tempo para garantir que o servidor está rodando antes de abrir a janela
    setTimeout(() => {
        createWindow();
    }, 1000); // Ajuste esse tempo conforme necessário

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Feche o servidor quando o Electron for fechado
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            serverProcess.kill(); // Mata o processo do servidor
            app.quit();
        }
    });
});
