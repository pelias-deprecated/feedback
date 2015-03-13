#!/usr/bin/env ruby

environment = ARGV[0]
ARGV[0] = nil

ENV['BUNDLE_GEMFILE'] ||= File.expand_path('../../DeployGemfile', __FILE__)
load Gem.bin_path('bundler', 'bundle')

require 'aws-sdk'

AWS.config(
  access_key_id: ENV["#{environment.upcase}_AWS_ACCESS_KEY_ID"],
  secret_access_key: ENV["#{environment.upcase}_AWS_SECRET_ACCESS_KEY"]
)

config = {
  staging: {
    stack_id: "c78babdf-216f-4714-9867-11d2bda5e184",
    app_id: "b751a33b-2286-4fee-9ccd-194efa31ec54"
  },
  production: {
    stack_id: "19eceb5b-c266-430c-a8b5-56c8468e6ad5",
    app_id: "c9933604-7ceb-4d2f-b59e-2e2acb5c179d"
  }
}

client = AWS::OpsWorks::Client.new

deployment = client.create_deployment(
  stack_id: config[environment.to_sym][:stack_id],
  app_id: config[environment.to_sym][:app_id],
  command: {
    name: "deploy"
  },
  comment: "Deploying build from circleci: #{ENV['CIRCLE_BUILD_NUM']} sha: #{ENV['CIRCLE_SHA1']} #{ENV['CIRCLE_COMPARE_URL']}"
)

timeout = 60 * 5
time_start = Time.now.utc
time_passed = 0
success = false

process = ["\\", "|", "/", "-"]
i = 0
while !success
  desc = client.describe_deployments(options = {:deployment_ids => [deployment[:deployment_id]]})
  success = desc[:deployments][0][:status] == "successful"
  time_passed = Time.now.utc - time_start 
  if i >= process.length - 1
    i = 0
  else
    i+=1
  end
  print "\r"
  print "Deploying: #{process[i]} status: #{desc[:deployments][0][:status]} timeout: #{timeout} -- time passed: #{time_passed}"
  if timeout < time_passed
    exit 1
  end
  sleep 4
end

exit 0
