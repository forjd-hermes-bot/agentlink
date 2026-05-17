let input = '';
for await (const chunk of process.stdin) input += chunk;
const event = JSON.parse(input);

console.log(JSON.stringify({
  actions: [
    {
      type: 'comment',
      body: `AgentLink demo received ${event.event} for ${event.repository.full_name}. Actor: @${event.actor.login}.`,
    },
  ],
}));
