import Vapi from '@vapi-ai/web';

let vapiInstance = null;

export const getVapi = () => {
    if (typeof window !== 'undefined' && !vapiInstance) {
        vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);
    }
    return vapiInstance;
};
