import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Resiliência de Rede: Interceptor para Backoff Exponencial (HTTP 429 Rate Limit)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        
        // Ativando lógica para erros de limites e caso ainda possua tentativas configuradas
        if (error.response && error.response.status === 429) {
            config.__retryCount = config.__retryCount || 0;
            
            // Máximo de 3 repetições no Frontend
            if (config.__retryCount < 3) {
                config.__retryCount += 1;
                
                // Exibe alert toast proativo para o usuário não ficar confuso (simulado aqui em console.log na UX real seria react-hot-toast)
                if (config.__retryCount === 1) {
                    console.log("[Resilience] Servidor sobrecarregado. Tentando novamente de forma invisível...");
                    // No sistema real: toast.loading("Processando volume alto, aguardando...");
                }

                // Lê o header de retry-after ou usa logica exponencial
                const waitTimeStr = error.response.headers['retry-after'];
                const waitTime = waitTimeStr ? parseInt(waitTimeStr, 10) * 1000 : (1000 * Math.pow(2, config.__retryCount));

                await new Promise(resolve => setTimeout(resolve, waitTime));
                
                return api(config);
            }
        }

        return Promise.reject(error);
    }
);

// Adiciona Token na Requesição (Zustand Auth Store poderia ser injetado aqui)
api.interceptors.request.use((config) => {
   const token = localStorage.getItem('jarvis-token');
   if (token && config.headers) {
       config.headers.Authorization = `Bearer ${token}`;
   }
   return config;
});

export default api;
