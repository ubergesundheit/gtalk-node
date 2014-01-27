#!/usr/bin/env ruby

require 'rubygems'
require 'blather/client'
require 'yaml'
require 'date'
require 'net/http'

@config = YAML.load_file(File.join(File.dirname(File.expand_path(__FILE__)), 'config.yml'))

@confirmed = false

def get_cat_url
  response = nil
  Net::HTTP.start('thecatapi.com', 80) do |http|
    response = http.head('/api/images/get')
  end
  response['location']
end

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
      msg = "#{@config['confirmation_messages'].sample)]} #{get_cat_url}"
      say @config['to'], msg
      say @config['obs'], msg
      @confirmed = true
      shutdown
    end
  end
end

# connect was successful..
when_ready do
  if (Time.now.to_i % @config['delay']) > 15
    sleep @config['delay'] - (Time.now.to_i % @config['delay'])
  end

  if send_today?
    say @config['obs'], 'Bot (re)started'
    while true do
      say @config['to'], @config['message']
      sleep @config['delay']
    end
  else
    if (21 - (Date.today - @config['start_date']).round % 28) == -6
      say @config['to'], @config['day_before_msg']
    end
    say @config['obs'], "#{21 - (Date.today - @config['start_date']).round % 28}"
    sleep 15
    @confirmed = true
    shutdown
  end
end

disconnected { client.connect unless @confirmed == true }
