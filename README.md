#Send a message via google hangouts every X minutes

####Requirements:
 * Ruby
 * https://github.com/adhearsion/blather gem
 * a Google account

####Installation:
 * `gem install blather`
 * `cp config.yml.example config.yml`
 * modify `config.yml`
 * modify your crontab `0 21 * * * PATH=$PATH:/usr/local/bin && bash -lc "/path/to/ptalk/ptalk.rb"` (if you are using rbenv)
