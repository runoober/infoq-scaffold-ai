#!/usr/bin/env ruby

require 'shellwords'
require 'uri'
require 'yaml'

mode = ARGV.fetch(0) do
  warn 'usage: resolve_backend_local_mcp_env.rb <mysql|redis> <application-local.yml>'
  exit 1
end

config_path = ARGV[1]
if config_path.nil? || config_path.empty?
  warn 'application-local.yml path is required'
  exit 1
end

unless File.file?(config_path)
  warn "missing config file: #{config_path}"
  exit 1
end

docs = YAML.load_stream(File.read(config_path, encoding: 'UTF-8'))

def emit_env(values)
  values.each do |key, value|
    next if value.nil?

    puts "#{key}=#{Shellwords.escape(value.to_s)}"
  end
end

case mode
when 'mysql'
  spring_doc = docs.find { |doc| doc.is_a?(Hash) && doc.dig('spring', 'datasource', 'dynamic', 'datasource', 'master') }
  abort 'mysql datasource config not found in application-local.yml' unless spring_doc

  master = spring_doc.dig('spring', 'datasource', 'dynamic', 'datasource', 'master')
  hikari = spring_doc.dig('spring', 'datasource', 'dynamic', 'hikari') || {}
  jdbc_url = master.fetch('url')
  uri = URI.parse(jdbc_url.sub(/\Ajdbc:/, ''))
  database = uri.path.to_s.sub(%r{\A/}, '')

  abort 'mysql host missing in datasource url' if uri.host.to_s.empty?
  abort 'mysql database missing in datasource url' if database.empty?

  emit_env(
    'MYSQL_HOST' => uri.host,
    'MYSQL_PORT' => uri.port,
    'MYSQL_USER' => master.fetch('username'),
    'MYSQL_PASSWORD' => master.fetch('password'),
    'MYSQL_DATABASE' => database,
    'MYSQL_CONNECTION_LIMIT' => hikari['maxPoolSize'],
    'MYSQL_READONLY' => 'true'
  )
when 'redis'
  redis_doc = docs.find { |doc| doc.is_a?(Hash) && doc.dig('spring.data', 'redis') }
  abort 'redis config not found in application-local.yml' unless redis_doc

  redis = redis_doc.dig('spring.data', 'redis')
  emit_env(
    'REDIS_HOST' => redis.fetch('host'),
    'REDIS_PORT' => redis.fetch('port'),
    'REDIS_PASSWORD' => redis['password'].to_s,
    'REDIS_DB' => redis.fetch('database'),
    'REDIS_READONLY' => 'true'
  )
else
  warn "unsupported mode: #{mode}"
  exit 1
end
