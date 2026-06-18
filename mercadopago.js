const { MercadoPagoConfig, Payment } = require("mercadopago");
require("dotenv").config();

// Inicializa o cliente do Mercado Pago com seu Access Token
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 10000 },
});

const paymentClient = new Payment(mpClient);

/**
 * Gera um pagamento PIX no Mercado Pago.
 * @param {object} params
 * @param {number}  params.amount           - Valor em R$ (ex: 29.90)
 * @param {string}  params.description      - Descrição do pagamento
 * @param {string}  params.payerEmail       - E-mail do pagador
 * @param {string}  params.externalReference - Referência externa única
 * @returns {Promise<object>} Objeto de pagamento do Mercado Pago
 */
async function generatePixPayment({ amount, description, payerEmail, externalReference }) {
  const body = {
    transaction_amount: amount,
    description,
    payment_method_id: "pix",
    payer: {
      email: payerEmail,
    },
    external_reference: externalReference,
    date_of_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
  };

  const payment = await paymentClient.create({ body });
  return payment;
}

/**
 * Consulta o status de um pagamento pelo ID.
 * @param {number|string} paymentId
 * @returns {Promise<string>} Status: 'approved' | 'pending' | 'in_process' | 'rejected' | ...
 */
async function checkPaymentStatus(paymentId) {
  const payment = await paymentClient.get({ id: paymentId });
  return payment.status;
}

module.exports = { generatePixPayment, checkPaymentStatus };
