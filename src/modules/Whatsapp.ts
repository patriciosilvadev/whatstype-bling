import { Client, Message } from '@open-wa/wa-automate';
import { api, apikey, config } from '../services/api'
import { ClientCredentials } from 'simple-oauth2';
import { response } from 'express';

interface Operation {
  from: string
  title: string | number
  coop: string
  unity: string
  description: string
  level: number
}

interface Customer {
  contato: {
    nome: string
    codigo: string
    cnpj: string
    ie_rg: string
    endereco: string
    numero: string
    bairro: string
    cep: string
    cidade: string
    uf: string
    fone: string
    email: string
  }
}

interface MessageDTO {
  from: string
}

interface Contact {
  contact_id: string,
  contact_name: string
  company_name: string
}

interface ResponsePostServiceDTO {
  retorno: {
    notasservico: NotaServicoP[]
  }
}

interface NotaServicoP {
  notaservico: {
    numero_rps: string
    serie: string
  }
}

interface ResponseDTO {
  nome: string
  cnpj: string
  endereco: string
  bairro: string
  cep: string
  cidade: string
  description: string
}




let operations: Operation[] = []
export let status = false

const scriptOS = {
  1: 'Qual o nome da sua cooperativa ? (Exemplo: Vale Sul, Ouro Branco, Nossa Terra )',
  2: 'Qual a sua agência ? (Exemplo: 04, UAD, 25, SUREG)',
  3: 'Descreva o motivo da OS. (Exemplo: Ramal 1205 inoperante)',
  4: 'A sua OS foi registrada com sucesso!',
}

const scriptCONTATO = {
  1: `Digite: 
      *1* - Comprar um produto
      *2* - Suporte Técnico
      `,
  2: 'Obrigado, logo nossos atendentes entrarão em contato'

}



async function createOperation(id: number): Promise<ResponseDTO> {

  const { coop, unity, description } = operations[id]
  try {
    const responseCustomer = await api.get('/contatos/json', {
      params: {
        apikey
      } 
    })

    const customers: Customer[] = responseCustomer.data.retorno.contatos


    const customer = customers.filter(cust =>
      cust.contato.nome.toLowerCase().includes(coop.toLowerCase())
      &&
      cust.contato.codigo.toLowerCase().includes(unity.toLowerCase())
    )
    if (customer.length === 0) {
      customers.filter( cust =>{
        if(cust.contato.nome.toLocaleLowerCase().includes(' unicoob ')){
          console.log(cust)
        }
      })
      throw new Error('Unidade ou cooperativa não encontrada');
    }

    const xml = `
    <pedido>
	   13/07/2020
     <cliente>
       <nome>${customer[0].contato.nome}</nome>
       <cnpj>${customer[0].contato.cnpj}</cnpj>
		 	 <ie>${customer[0].contato.ie_rg}</ie>
       <endereco>${customer[0].contato.endereco}</endereco>
       <numero>${customer[0].contato.numero}</numero>
		   <complemento></complemento>
       <bairro>${customer[0].contato.bairro}</bairro>
       <cep>${customer[0].contato.cep}</cep>
       <cidade>${customer[0].contato.cidade}</cidade>
       <uf>${customer[0].contato.uf}</uf>
       <fone>${customer[0].contato.fone}</fone>
       <email>${customer[0].contato.email}</email>
 	  	</cliente>
 	  	<servicos>
    	<servico>
        <codigo>3.2.1</codigo>
        <descricao>${description} - ${customer[0].contato.codigo} </descricao>
      </servico>
    	</servicos>
    </pedido>
    `

    const xmlConfig = config
    xmlConfig.params = {
      apikey,
      xml
    }


    await api.post<ResponsePostServiceDTO>('notaservico/json', '', xmlConfig)

    const { nome, cnpj, endereco, bairro, cep, cidade } = customer[0].contato
    return { nome, cnpj, endereco, bairro, cep, cidade, description }


  } catch (err) {
    console.log(err)
    return { nome: '', cnpj: '', endereco: '', bairro: '', cep: '', cidade: '', description: '' };
  }

}


function verifyCustomer(message: MessageDTO): number {
  const operationIndex = operations.findIndex(operation => operation.from === message.from)
  if (operationIndex >= 0)
    return operationIndex
  else {
    operations.push({
      from: message.from,
      title: '',
      coop: '',
      unity: '',
      description: '',
      level: 1
    })
    return operations.length - 1
  }

}

async function contact(operationIndex: number, message: Message, client: Client) {
  switch (operations[operationIndex].level) {
    case 1:
      await client.sendText(message.from, scriptCONTATO[1])
      operations[operationIndex].level++
      break;
    case 2:
      switch (message.body) {
        case '1':
          await client.sendText('554192724349@c.us', `Pedido de contato para o número: ${message.from.slice(2, 13)}`)
          await client.sendText(message.from, 'Obrigado, em breve entraremos em contato!')
          break;
        case '2':
          await client.sendText('5511952772090@c.us', `Pedido de contato para o número: ${message.from.slice(2, 13)}`)
          await client.sendText(message.from, 'Obrigado, em breve entraremos em contato!')
          break;
        default:
          await client.sendText(message.from, `Opção Invalida`)
      }
      operations.splice(operationIndex, 1)
      break;
  }
}

async function serviceOrder(operationIndex: number, message: Message, client: Client) {
  switch (operations[operationIndex].level) {
    case 1:
      await client.sendText(message.from, scriptOS[1])
      operations[operationIndex].level++
      break;
    case 2:
      operations[operationIndex].coop = message.body
      await client.sendText(message.from, scriptOS[2])
      operations[operationIndex].level++
      break;
    case 3:
      operations[operationIndex].unity = message.body
      await client.sendText(message.from, scriptOS[3])
      operations[operationIndex].level++
      break;
    case 4:
      operations[operationIndex].description = message.body

      const createdOperation = await createOperation(operationIndex)

      if (createdOperation.nome !== '') {
        await client.sendText(message.from, scriptOS[4])
        await client.sendText('5511952772090@c.us', `Nova OS registrada`)

      } else {
        await client.sendText(message.from, `Falha em registrar OS, tente novamente.`)
        await client.sendText('5511952772090@c.us', `Falha de registro de OS`)

      }
      operations.splice(operationIndex, 1)
      break;
  }
}

async function setStatus(client: Client) {
  status = await client.isConnected()
}

async function Whatsapp(client: Client) {
  await setStatus(client)
  client.onMessage(async (message) => {
    const operationIndex = verifyCustomer(message)

    const formatedMessage = message.body

    switch (operations[operationIndex].title) {
      case '':
        client.sendText(message.from,
          `Olá! Eu sou o atendente virtual da Agora IP. Posso te ajudar ? 
        
          *1* - Registrar uma OS
          *2* - Entrar em contato conosco
        `)
        operations[operationIndex].title = 'Waiting'
        break;
      case 'Waiting':
        switch (formatedMessage) {
          case '1':
            operations[operationIndex].title = 'OS'
            break;

          case '2':
            operations[operationIndex].title = 'CONTATO'
            break;

          default:
            await client.sendText(message.from,
              `Não entendi muito bem, atualmente podemos:
              *1* - Registrar uma OS
              *2* - Entrar em contato conosco
            `)
            return;
        }
        break;
    }

    if (operations[operationIndex].title !== '' && operations[operationIndex].title !== 'Waiting') {
      switch (operations[operationIndex].title) {
        case 'OS':
          serviceOrder(operationIndex, message, client)
          break;

        case 'CONTATO':
          contact(operationIndex, message, client)
          break;
      }
    }
  })
}

export default Whatsapp
