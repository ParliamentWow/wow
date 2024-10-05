import { Hono } from 'hono';

const api = new Hono();

api.get('/api', (c) => { 
    return c.text('Hello World');
});

export default api