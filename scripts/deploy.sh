#!/bin/bash

# export NODE_ENV=production

print_command_header () {
  printf "\n##\n# DEPLOY: $1\n##\n"
}

check_command_success () {
  if [ $? -ne 0 ]
  then
    print_command_header "$1 failed"
    exit 1
  fi
}

cd ~/shorty/

print_command_header "stop existing service"
pm2 stop shorty
check_command_success "pm2 stop shorty"

print_command_header "clean up modifications"
git checkout .
check_command_success "git checkout ."

print_command_header "clean dependencies"
rm -rf node_modules/
check_command_success "rm -rf node_modules/"

print_command_header "get new tags from remote"
git fetch --tags
check_command_success "git fetch --tags"

tag=$1

if [ $tag ]
then
  print_command_header "use specified tag"
else
  print_command_header "get latest tag name"
  tag=$(git describe --tags `git rev-list --tags --max-count=1`)
fi

print_command_header "checkout tag"
git checkout $tag
check_command_success "git checkout $tag"

print_command_header "install dependencies"
npm install --prefer-offline
check_command_success "npm install --prefer-offline"

print_command_header "build css"
npm run sass:build
check_command_success "npm run sass:build"

print_command_header "start process"
pm2 start ecosystem.config.js --env production
check_command_success "pm2 start ecosystem.config.js --env production"
