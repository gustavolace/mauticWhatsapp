function fetchMessages() {
    fetch('/messages')
        .then(response => response.json())
        .then(data => {
            const messageContainer = document.getElementById('messageContainer');
            messageContainer.innerHTML = ''; // Limpa o conteúdo atual

            // Adiciona cada mensagem ao container
            data.messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.textContent = message;
                messageContainer.appendChild(messageElement);
            });

            // Faz o scroll automático para o final do container
            messageContainer.scrollTop = messageContainer.scrollHeight;
        })
        .catch(error => console.error('Erro na requisição:', error));
}
setInterval(fetchMessages, 2000);
fetchMessages()

function loadText() {
    const textarea = document.getElementById('numbers');
    fetch('/get-text')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(text => {
            textarea.value = text; // Define o conteúdo do textarea
        })
        .catch(error => {
            console.error('Erro ao carregar o texto:', error);
        });
}
loadText()


function previewImage() {
    const file = document.getElementById('imageInput').files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };

        reader.readAsDataURL(file);
    }
}

function sendMessages() {
    const numbers = document.getElementById('numbers').value.split('\n').filter(n => n.trim() !== '');
    const message = document.getElementById('message').value;
    const imageSrc = document.getElementById('imagePreview').src;

    if (numbers.length === 0 || message.trim() === '') {
        alert("Por favor, insira os números e a mensagem.");
        return;
    }

    console.log("Números:", numbers);
    console.log("Mensagem:", message);
    console.log("Imagem:", imageSrc ? imageSrc : "Nenhuma imagem inserida.");

    // Preparar os dados para envio
    const formData = new FormData();
    formData.append('numbers', JSON.stringify(numbers));
    formData.append('message', message);

    if (imageSrc && imageSrc.startsWith('data:image/')) {
        // Criar um Blob a partir da data URL da imagem
        const imageBlob = dataURLToBlob(imageSrc);
        formData.append('image', imageBlob, 'image.jpg');
    }

    // Enviar os dados usando fetch
    fetch("/send-message", {
        method: "POST",
        body: formData
    })
    .then((response) => response.json())
    .then((data) => {
        // Exibir resposta do servidor
        console.log("Resposta do servidor:", data);
    })
    .catch((error) => {
        // Exibir mensagem de erro
        alert("Ocorreu um erro ao enviar as mensagens.");
        console.error("Erro:", error);
    });
}

// Função para converter uma data URL em Blob
function dataURLToBlob(dataURL) {
    const [header, data] = dataURL.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: mime });
}


///

async function fetchContacts() {
    try {
        const response = await fetch('/contacts'); // URL da API que retorna os contatos
        const contacts = await response.json();

        const tableBody = document.querySelector('#contactsTable tbody');
        const loadingDiv = document.querySelector('#loading');
        const table = document.querySelector('#contactsTable');

        // Limpa a tabela antes de adicionar novos contatos
        tableBody.innerHTML = '';

        // Itera sobre os contatos e adiciona na tabela
        contacts.forEach(contact => {
            // Exclui contatos com Do Not Contact (Yes)
            if (contact['Do Not Contact'] === 'No') {
                const row = document.createElement('tr');

                // Adiciona células com os dados do contato
                row.innerHTML = `
                    <td>${contact.ID}</td>
                    <td>${contact.Name}</td>
                    <td>${contact.Mobile}</td>
                    <td>${contact['Do Not Contact']}</td>
                `;

                // Adiciona a linha à tabela
                tableBody.appendChild(row);
            }
        });

        // Esconde o carregamento e exibe a tabela
        loadingDiv.style.display = 'none';
        table.style.display = 'table'; // Exibe a tabela

    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        const loadingDiv = document.querySelector('#loading');
        loadingDiv.textContent = 'Erro ao carregar contatos.';
    }
}

// Chama a função para buscar e exibir os contatos ao carregar a página
window.onload = fetchContacts; 