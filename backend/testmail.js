import{ MailtrapClient } from "mailtrap";

const TOKEN = "64cef78219e23b0c42c8b03dd41d9bb1";

const client = new MailtrapClient({
  token: TOKEN,
});

const sender = {
  email: "hello@demomailtrap.com",
  name: "Mailtrap Test",
};
const recipients = [
  {
    email: "rishabhid777@gmail.com",
  }
];

client
  .send({
    from: sender,
    to: recipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap! this is 2nd email I am sending",
    category: "Integration Test",
  })
  .then(console.log, console.error);