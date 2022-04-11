import { Request, Response } from 'express';
import crypto from 'crypto';

const getHmacMessage = (req: Request) => {
  const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase();
  const TWITCH_MESSAGE_TIMESTAMP =
    'Twitch-Eventsub-Message-Timestamp'.toLowerCase();
  const messageId = req.headers[TWITCH_MESSAGE_ID] as string;
  const timeStamp = req.headers[TWITCH_MESSAGE_TIMESTAMP] as string;
  const body: string = req.body;
  return messageId + timeStamp + body;
};

const getHmac = (secret: string, message: string) => {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
};

const verifyMessage = (hmac: string, verifySignature: string) => {
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(verifySignature)
  );
};

export default (req: Request, res: Response) => {
  try {
    const TWITCH_MESSAGE_SIGNATURE =
      'Twitch-Eventsub-Message-Signature'.toLowerCase();
    const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase();
    const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification';
    const MESSAGE_TYPE_NOTIFICATION = 'notification';
    const MESSAGE_TYPE_REVOCATION = 'revocation';

    const secret = process.env.CLIENT_SECRET as string;
    const message = getHmacMessage(req);
    const HMAC_PREFIX = 'sha256=';
    const hmac = HMAC_PREFIX + getHmac(secret, message);

    if (!verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE] as string)) {
      console.log('403');
      res.sendStatus(403);
    }

    const notification = JSON.parse(req.body);

    switch (req.headers[MESSAGE_TYPE]) {
      case MESSAGE_TYPE_NOTIFICATION:
        // TODO: Do something with the event's data

        console.log(`Event type: ${notification.subscription.type}`);
        console.log(JSON.stringify(notification.event, null, 4));
        res.sendStatus(204);
        break;
      case MESSAGE_TYPE_VERIFICATION:
        res.status(200).send(notification.challenge);
        break;
      case MESSAGE_TYPE_REVOCATION:
        res.sendStatus(204);

        console.log(`${notification.subscription.type} notifications revoked!`);
        console.log(`reason: ${notification.subscription.status}`);
        console.log(
          `condition: ${JSON.stringify(
            notification.subscription.condition,
            null,
            4
          )}`
        );
      default:
        res.sendStatus(204);
        console.log(`Unkown message type: ${req.headers[MESSAGE_TYPE]}`);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};
