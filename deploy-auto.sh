#!/usr/bin/expect -f

# ========================================
# Auto Deploy Script - No password needed!
# ========================================

set timeout -1

puts "🚀 Starting deployment to play.okeforyou.com..."
puts "🔐 Connecting to server..."

spawn ssh okefor@139.99.114.128

expect {
    "Are you sure you want to continue connecting" {
        send "yes\r"
        expect "password:"
        send "\$0rHSuQujx8fzu?w\r"
    }
    "password:" {
        send "\$0rHSuQujx8fzu?w\r"
    }
}

expect "$ "
puts "✅ Connected!"

puts "📁 Moving to directory..."
send "cd /var/www/vhosts/play.okeforyou.com/httpdocs\r"
expect "$ "

puts "📥 Downloading deployment script..."
send "curl -sO https://raw.githubusercontent.com/okeforyou/youoke/main/deploy-to-plesk.sh\r"
expect "$ "

puts "🔧 Making script executable..."
send "chmod +x deploy-to-plesk.sh\r"
expect "$ "

puts "🚀 Running deployment script..."
send "./deploy-to-plesk.sh\r"

# Wait for deployment to complete
expect {
    "🎉 Deployment completed successfully!" {
        puts "\n✅ Deployment done!"
    }
    timeout {
        puts "\n⚠️  Deployment taking longer than expected..."
    }
}

send "exit\r"
expect eof

puts "\n✅ All done! Check https://play.okeforyou.com"
