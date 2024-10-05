import { Hono } from 'hono';
import transcriptions from './transcriptions';
const api = new Hono();

api.get('/api', (c) => { 
    return c.text('Hello World');
});

api.route('/api', transcriptions);

export default api