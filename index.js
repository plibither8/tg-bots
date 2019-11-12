const fastify = require('fastify')()
const fetch = require('node-fetch')

const { CHAT_ID } = process.env

fastify.post('/:botName', async (req, reply) => {
	if (!req.body.secret || req.body.secret !== process.env.SECRET_STRING) {
		reply
			.code(403)
			.send('Secrets did not match or not provided.')
	}

	const { botName } = req.params

	const BOT_KEY = process.env[botName.toUpperCase()]
	if (!BOT_KEY) {
		reply
			.code(400)
			.send('Bot does not exist.')
	}

	const API_URL = `https://api.telegram.org/bot${BOT_KEY}/sendMessage`

	const body = {
		chat_id: CHAT_ID,
		parse_mode: 'Markdown',
		disable_web_page_preview: true,
		...req.body
	}

	await fetch(API_URL, {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			'Content-Type': 'application/json'
		}
	})

	reply.send('Message sent!')
})

fastify.listen(process.env.PORT || 3000, err => {
	if (err) throw err
})
