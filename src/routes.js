const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require('path'); 
const fs = require('fs')
const base64 = require('base-64');

let isClientReady = false;

let messages = ['Autenticando...'];

// web
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');;

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "meu-bot" // Identificador único para a sessão
    })
});

// multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//qr
let qrCodeData = null;


client.on('qr', async (qr) => {
    try {
        qrCodeData = await qrcode.toDataURL(qr); // Converte QR code para Data URL
        messages.push('QR code gerado. Escaneie para conectar.');
    } catch (err) {
        messages.push('Erro ao gerar QR code:', err);
    }
});

client.on('ready', () => {
    messages.push("Cliente Pronto")
    isClientReady = true;
});

client.initialize();

//

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'index.html'));
});

router.get("/qrcode", (req, res) => {
    if (qrCodeData) {
        res.send(`
                <h2>Escaneie o QR code para conectar ao WhatsApp</h2>
                <img src="${qrCodeData}" alt="QR Code">
                <a href="/">VOLTAR<a>`
            );
    } else {
        res.send('QR code ainda não gerado ou já escaneado. Por favor, recarregue a página. <a href="/">VOLTAR<a>');
    }
});

router.get('/messages', (req, res) => {
    res.json({ messages });
});

router.get('/get-text', (req, res) => {
    const filePath = path.join(__dirname, 'assets', 'savedText.txt');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Erro ao ler o arquivo.');
        }
        const numbers = JSON.parse(data);
        const formattedText = numbers.join('\n');
        res.send(formattedText);
    });
});


const axios = require('axios');
const Buffer = require('buffer').Buffer; // Certificando-se de que o Buffer está disponível

//env
require('dotenv').config();
const MAUTIC_BASE_URL = process.env.MAUTIC_BASE_URL;
const USERNAME = process.env.MAUTIC_USERNAME;
const PASSWORD = process.env.MAUTIC_PASSWORD;

const authString = `${USERNAME}:${PASSWORD}`;
const authBase64 = Buffer.from(authString).toString('base64');
const headers = {
    'Authorization': `Basic ${authBase64}`,
};


router.get('/contacts', async (req, res) => {
    try {
        async function fetchContacts(baseUrl, headers, limit = 2000) {
            //const url = `${baseUrl}?limit=${limit}`;
            const url = `${baseUrl}?limit=${limit}&search="gustavo"`;
            console.log(`Fetching contacts with limit=${limit}`); // Log do limite de requisição

            try {
                const response = await axios.get(url, { headers });
                const contacts = response.data.contacts || {};
                console.log(`Total contacts fetched from API: ${Object.keys(contacts).length}`); // Log do total retornado pela API
                return Object.values(contacts); // Retorna os contatos como array
            } catch (error) {
                console.error('Erro na requisição:', error.message);
                throw error;
            }
        }

        // Função para formatar o número de telefone
        function formatPhoneNumber(phone) {
            // Remove todos os caracteres não numéricos
            let formatted = phone.replace(/\D/g, '');
          
            // Adiciona o DDD 55 se necessário
            if (!formatted.startsWith('55')) {
              formatted = '55' + formatted;
            }
          
            const dddLength = 2; // Assumindo que o DDD tenha 2 dígitos
            const nineIndex = formatted.indexOf('9', dddLength); // Busca o "9" a partir do terceiro dígito
            if (nineIndex !== -1) {
                formatted = formatted.slice(0, nineIndex) + formatted.slice(nineIndex + 1);
            }
            
            // Garante que o número tenha no máximo 12 dígitos
            formatted = formatted.slice(0, 12);
            return formatted;
          }

        // Buscar contatos com limite elevado
        const contacts = await fetchContacts(`${MAUTIC_BASE_URL}/api/contacts`, headers);

        // Filtrar os contatos para manter apenas os com mobile não nulo e exibir campos selecionados
        const filteredContacts = contacts
            .map(contact => {
                const contactFields = contact.fields ? contact.fields.core : {};
                const id = contact.id;
                const firstname = contactFields.firstname ? contactFields.firstname.value : 'N/A';
                let mobile = contactFields.mobile ? contactFields.mobile.value : null;
                const doNotContact = contact.doNotContact && contact.doNotContact.length > 0 ? 'Yes' : 'No';

                // Formatar o número de telefone se existir
                if (mobile) {
                    mobile = formatPhoneNumber(mobile);

                    // Retorna o contato apenas se o mobile for válido
                    return {
                        ID: id,
                        Name: firstname,
                        Mobile: mobile,
                        'Do Not Contact': doNotContact,
                    };
                }
                return null; // Exclui os contatos com mobile nulo
            })
            .filter(contact => contact); // Filtra contatos vazios

        console.log(`Filtered contacts count: ${filteredContacts.length}`); // Log do total filtrado

        // Retornar a resposta JSON com os contatos filtrados
        res.json(filteredContacts);
    } catch (error) {
        console.error('Erro:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});




router.post("/send-message", upload.single('image'), async (req, res) => {

    /* if (!isClientReady) {
        return res.status(503).send('Cliente ainda não está pronto.');
    }
 */
    const { numbers, message } = req.body;
    console.log(numbers)
    const image = req.file
    console.log(image)
    console.log(message)

    if (!numbers || !message) {
        messages.push("Números e mensagem são necessários.")
        return res.status(400).send('Números e mensagem são necessários.');
    }
    
    const filePath = path.join(__dirname, 'assets', 'savedText.txt');
    try {
        await new Promise((resolve, reject) => {
            fs.writeFile(filePath, numbers, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        return res.status(500).send('Erro ao salvar o arquivo.');
    }

    const results = [];
    const errors = [];


/*     for (const number of numberArray) {
        try {
            // Se uma imagem foi enviada, você pode processá-la aqui
            if (image) {
                messages.push(`Enviando para ${number}`)
                const media = new MessageMedia(image.mimetype, image.buffer.toString('base64'), image.originalname);
                await client.sendMessage(`${number}@c.us`, media, { caption: message });
            } else{
                messages.push(`Enviando para ${number}`)
                await client.sendMessage(`${number}@c.us`, message);
            }
            results.push(`${number}`);
        } catch (error) {
            errors.push(`${number}`);
        }
    }
    messages.push("Sucesso:");
    messages.push(...results);
    messages.push("Erros:");
    messages.push(...errors);

    if (errors.length > 0) {
        res.status(500).send({ results, errors });
    } else {
        res.status(200).send(results);
    } */
});



module.exports = router;
