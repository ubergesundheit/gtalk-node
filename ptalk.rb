#!/usr/bin/env ruby

require 'rubygems'
require 'blather/client'
require 'yaml'
require 'date'

@config = YAML.load_file(File.join(File.dirname(File.expand_path(__FILE__)), 'config.yml'))

# need to send today?
def send_today?
  day_today = (Date.today - @config['start_date']).round
  (day_today % 28) < 21
end

# initialize xmpp
setup @config['jid'], @config['password'], 'talk.google.com'

# listen to responses
message :chat?, :body do |m|
  if m.from.to_s.start_with?(@config['to']) || m.from.to_s.start_with?(@config['obs'])
    if m.body.downcase == @config['hot_word']
      msg = @config['confirmation_messages'][rand(@config['confirmation_messages'].length)]
      say @config['to'], msg
      say @config['obs'], msg
      shutdown
    end
  end
end

# connect was successful..
when_ready do
  if send_today?
    say @config['obs'], 'Notification started'
    while true do
      say @config['to'], @config['message']
      sleep @config['delay']
    end
  else
    say @config['obs'], "#{21 - (Date.today - @config['start_date']).round % 28}"
    sleep 15
    shutdown
  end
end
