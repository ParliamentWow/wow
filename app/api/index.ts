import { Hono } from 'hono';
import transcriptions from './transcriptions';
import sessions from './sessions';
const api = new Hono();

api.onError((err, c) => {
    console.error(`${err}`)
    return c.json(err, 500)
});

api.get('/api', (c) => { 
    return c.text('Parliment wow!');
});

api.route('/api', sessions)
api.route('/api', transcriptions);

export default api