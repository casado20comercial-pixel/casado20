import axios from 'axios'

// --- Configuração ---
const hiperApiUrl = process.env.HIPER_API_URL
const hiperSecurityKey = process.env.HIPER_APP_TOKEN // Renomeado para clareza

if (!hiperApiUrl || !hiperSecurityKey) {
  throw new Error('Hiper API URL and Security Key (HIPER_APP_TOKEN) are required.')
}

// --- Instância Axios ---
// A instância é criada sem o header de autorização, pois ele será dinâmico.
// FIX: Voltando para ms-ecommerce pois api-hcp falhou na Auth.
export const hiperApi = axios.create({
  baseURL: 'http://ms-ecommerce.hiper.com.br', // Auth funcionou aqui anteriormente
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Gerenciamento de AccessToken (Cache em memória) ---
let accessToken: string | null = null
let tokenExpiresAt: number | null = null

/**
 * Obtém um AccessToken válido, buscando um novo se necessário.
 * @returns {Promise<string>} O AccessToken.
 */
async function getAccessToken(): Promise<string> {
  // Se temos um token e ele ainda não expirou (com 60s de margem), o usamos.
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60000) {
    return accessToken
  }

  try {
    console.log('Fetching new AccessToken from Hiper API...')
    // Usando axios relative path agora que a baseURL está correta (ms-ecommerce)
    // Endpoint: /api/v1/auth/gerar-token/{token}
    // Nota: O axios usa a baseURL definida na criação da instância
    const response = await hiperApi.get<{ accessToken: string }>(
      `/api/v1/auth/gerar-token/${hiperSecurityKey}`
    )

    // FIX: O payload real retorna "token", não "accessToken".
    // Ajustando o destructuring para pegar a propriedade correta.
    const { token: newAccessToken } = response.data as any

    // Verificação de segurança
    if (!newAccessToken) {
      throw new Error('Token not found in Auth response')
    }

    const assumedExpiresIn = 3600 // 1 hora de validade
    accessToken = newAccessToken
    tokenExpiresAt = Date.now() + (assumedExpiresIn * 1000)

    return accessToken as string // Cast para garantir ao TS que não é null
  } catch (error) {
    console.error('Failed to fetch Hiper AccessToken:', error)
    accessToken = null
    tokenExpiresAt = null
    throw new Error('Could not authenticate with Hiper API.')
  }
}

// --- Interceptor para Injetar o Token Dinamicamente ---
hiperApi.interceptors.request.use(async (config) => {
  // Não precisamos de token para a chamada de autenticação
  // A URL deve corresponder ao endpoint de autenticação
  if (config.url?.includes('auth/gerar-token')) {
    return config
  }

  try {
    const token = await getAccessToken()
    config.headers.Authorization = `Bearer ${token}`
    return config
  } catch (error) {
    console.error('Failed to add auth token to request.')
    return Promise.reject(error)
  }
})

hiperApi.interceptors.response.use(response => {
  return response
}, error => {
  return Promise.reject(error)
})

// --- Métodos da API ---

export interface HiperProductResponse {
  products: any[] // Tipagem frouxa proposital para inspeção
  total: number
}

export async function fetchProductsFromHiper(): Promise<any> {
  const allProducts: any[] = [];
  let pontoDeSincronizacao = 0;
  let hasMore = true;

  console.log('[API] Starting full product sync from Hiper...');

  try {
    while (hasMore) {
      const response = await hiperApi.get('/api/v1/produtos/pontoDeSincronizacao', {
        params: { pontoDeSincronizacao }
      });

      const data = response.data;
      const batch = Array.isArray(data) ? data : (data.produtos || data.products || data.items || []);


      if (batch.length === 0) {
        hasMore = false;
      } else {
        allProducts.push(...batch);

        const lastItem = batch[batch.length - 1];
        if (lastItem && lastItem.pontoDeSincronizacao) {
          if (pontoDeSincronizacao === lastItem.pontoDeSincronizacao) {
            hasMore = false;
          } else {
            pontoDeSincronizacao = lastItem.pontoDeSincronizacao;
          }
        } else {
          hasMore = false;
        }
      }
    }

    // Original code returned response.data directly.
    // Let's return a merged object structure that route.ts can parse.
    return allProducts;

  } catch (error) {
    console.error('Error fetching products from Hiper:', error);
    throw error;
  }
}
