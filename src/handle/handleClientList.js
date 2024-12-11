const axios = require('axios');
const base64 = require('base-64');

// Função para verificar se o contato está vazio
function isContactEmpty(contactFields) {
    const firstname = contactFields.firstname && contactFields.firstname.value;
    const email = contactFields.email && contactFields.email.value;
    const mobile = contactFields.mobile && contactFields.mobile.value;
    return !(firstname || email || mobile);
}

// Função para exibir os contatos em formato de tabela
function displayContacts(contacts) {
    let displayed = 0;
    let excluded = 0;

    const table = contacts.map(contact => {
        const contactFields = contact.fields ? contact.fields.core : {};
        const id = contact.id;
        const firstname = contactFields.firstname ? contactFields.firstname.value : 'N/A';
        const email = contactFields.email ? contactFields.email.value : 'N/A';
        const mobile = contactFields.mobile ? contactFields.mobile.value : 'N/A';
        const doNotContact = contactFields['doNotContact'] ? 'Yes' : 'No';

        // Verifica se o contato não está vazio
        if (!isContactEmpty(contactFields)) {
            displayed++;
            return { ID: id, 'First Name': firstname, Email: email, Mobile: mobile, 'Do Not Contact': doNotContact };
        } else {
            excluded++;
        }
    }).filter(contact => contact); // Filtra contatos vazios

    //console.table(table);
    console.log(`\nTotal de contatos exibidos: ${displayed}`);
    console.log(`Total de contatos excluídos (todos os campos vazios): ${excluded}`);
}

// Função para buscar todos os contatos
async function fetchAllContacts(baseUrl, headers, limit = 100) {
    let start = 0;
    let allContacts = [];
    let totalFetched = 0;

    while (true) {
        const url = `${baseUrl}?start=${start}&limit=${limit}`;
        try {
            const response = await axios.get(url, { headers });
            const data = response.data;

            const contacts = data.contacts || {};
            const fetched = Object.keys(contacts).length;

            if (fetched === 0) break;

            allContacts = allContacts.concat(Object.values(contacts));
            totalFetched += fetched;

            console.log(`Buscando contatos: ${start} - ${start + fetched}`);
            
            if (fetched < limit) break;
            start += limit;
        } catch (error) {
            console.error('Erro na requisição:', error);
            break;
        }
    }

    console.log(`\nTotal de contatos buscados: ${totalFetched}`);
    return allContacts;
}

// Configurações do Mautic
const MAUTIC_BASE_URL = process.env.MAUTIC_BASE_URL;
const USERNAME = process.env.MAUTIC_USERNAME;
const PASSWORD = process.env.MAUTIC_PASSWORD;

// Codificar username:password em base64
const authString = `${USERNAME}:${PASSWORD}`;
const authBase64 = base64.encode(authString);

// Cabeçalho de autenticação
const headers = {
    'Authorization': `Basic ${authBase64}`, // Usando a string Base64 codificada
};

// Buscar contatos
const url = `${MAUTIC_BASE_URL}/api/contacts`;

(async () => {
    const contacts = await fetchAllContacts(url, headers);
    console.log(`Total de contatos retornados: ${contacts.length}`);

    displayContacts(contacts);
})();
