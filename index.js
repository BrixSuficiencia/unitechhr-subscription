require('dotenv').config()
const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const app = express()

app.set('view engine', 'ejs')

app.get('/', async (req, res) => {
    res.render('index.ejs')
})

app.get('/subscribe', async (req, res) => {
    const plan = req.query.plan

    if (!plan) {
        return res.send('Subscription plan not found')
    }

    let priceId

    switch (plan.toLowerCase()) {
        case 'subscription':
            priceId = 'price_1QKHSDITW6O7brLA0TiFI9om'
            break

        default:
            return res.send('Subscription plan not found')
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
            {
                price: priceId,
                quantity: 1
            }
        ],
        //redirects if successful
        success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BASE_URL}/cancel`
    })

    res.redirect(session.url)
})

app.get('/success', async (req, res) => {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ['subscription', 'subscription.plan.product'] })

    console.log(JSON.stringify(session))

    res.send('Subscribed Successfully')
})

app.get('/cancel', (req, res) => {
    res.redirect('/')
})

//For Cancelling Subscription
app.get('/customers/:customerId', async (req, res) => {
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: req.params.customerId,
        return_url: `${process.env.BASE_URL}/`
    })

    res.redirect(portalSession.url)
})

app.listen(3000, () => console.log('Server started on port 3000'))