const paymentMode = require("../../model/payment_additional/addPaymentModel");
const router = require("express").Router();

//Adding then Payment gateway
router.post('/addGateway', async (req, res) => {
    try {
        const { gatewayName } = req.body;
        const existingPaymentMode = await paymentMode.findOne({ gatewayName: gatewayName });

        if (existingPaymentMode) {
            return res.status(400).send({
                message: 'Payment mode with the same name already exists'
            });
        }

        const newPaymentMode = new paymentMode({
            gatewayName: gatewayName
        });

        const savedPaymentMode = await newPaymentMode.save();

        if (savedPaymentMode) {
            return res.status(200).send({
                message: 'Payment mode added successfully',
                data: savedPaymentMode
            });
        } else {
            return res.status(500).send({
                message: 'Failed to add payment mode'
            });
        }
    } catch (error) {
        return res.status(400).send({
            status: 0,
            error: error.message
        });
    }
});

//List the  Payment gateway
router.get('/listGateways', async (req, res) => {
    try {
        const paymentModes = await paymentMode.find();
        if (paymentModes.length > 0) {
            res.status(200).send({
                message: 'Payment modes retrieved successfully',
                data: paymentModes
            });
        } else {
            res.status(404).send({
                message: 'No payment modes found'
            });
        }
    } catch (error) {
        res.status(500).send({
            message: 'Failed to retrieve payment modes',
            error: error.message
        });
    }
});

//Find the payment gateway by Name 
router.get('/findGatewayByName', async (req, res) => {
    try {
        const { gatewayName } = req.body;
        console.log(gatewayName,"paymentName")
        const findGateway = await paymentMode.findOne({ gatewayName:gatewayName });
        if (findGateway) {
            res.status(200).send({
                message: 'Payment mode found',
                data: findGateway
            });
        } else {
            res.status(404).send({
                message: 'Payment mode not found'
            });
        }
    } catch (error) {
        res.status(500).send({
            message: 'Failed to find payment mode',
            error: error.message
        });
    }
});

module.exports = router;
