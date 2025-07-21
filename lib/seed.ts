import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

const churchCategories = [
  {
    name: 'Christian Books',
    description: 'Inspiring books for spiritual growth and Bible study'
  },
  {
    name: 'Worship Music',
    description: 'CDs, vinyl, and digital downloads of contemporary Christian music'
  },
  {
    name: 'Study Materials',
    description: 'Bible study guides, devotionals, and educational resources'
  },
  {
    name: 'Kids & Youth',
    description: 'Christian resources for children and teenagers'
  },
  {
    name: 'Church Supplies',
    description: 'Communion supplies, offering plates, and church accessories'
  },
  {
    name: 'Gifts & Accessories',
    description: 'Crosses, jewelry, home decor, and Christian gifts'
  }
]

const ministryTemplates = [
  {
    name: 'Adult Sunday School',
    description: 'Weekly Bible study for adults every Sunday morning',
    leader: 'Pastor John Smith',
    meetingTime: 'Sundays 9:00 AM',
    location: 'Fellowship Hall'
  },
  {
    name: 'Youth Ministry',
    description: 'Fun and fellowship for teens ages 13-18',
    leader: 'Sarah Johnson',
    meetingTime: 'Fridays 7:00 PM',
    location: 'Youth Room'
  },
  {
    name: 'Children\'s Ministry',
    description: 'Nurturing young hearts with age-appropriate lessons',
    leader: 'Mary Wilson',
    meetingTime: 'Sundays 10:30 AM',
    location: 'Children\'s Wing'
  },
  {
    name: 'Worship Team',
    description: 'Leading congregation in meaningful worship through music',
    leader: 'David Brown',
    meetingTime: 'Saturdays 6:00 PM',
    location: 'Sanctuary'
  },
  {
    name: 'Women\'s Bible Study',
    description: 'Weekly Bible study and fellowship for women',
    leader: 'Jennifer Davis',
    meetingTime: 'Wednesdays 10:00 AM',
    location: 'Conference Room'
  },
  {
    name: 'Men\'s Fellowship',
    description: 'Monthly fellowship and service projects for men',
    leader: 'Michael Thompson',
    meetingTime: 'First Saturday 8:00 AM',
    location: 'Fellowship Hall'
  }
]

const sampleSermons = [
  {
    title: 'Walking in Faith',
    scriptureReference: 'Hebrews 11:1-6',
    series: 'Heroes of Faith',
    description: 'Discovering what it means to live by faith in uncertain times'
  },
  {
    title: 'The Power of Prayer',
    scriptureReference: 'Matthew 6:5-15',
    series: 'Spiritual Disciplines',
    description: 'Understanding how prayer transforms both us and our circumstances'
  },
  {
    title: 'Love Your Neighbor',
    scriptureReference: 'Luke 10:25-37',
    series: 'Parables of Jesus',
    description: 'The Good Samaritan teaches us about radical love and compassion'
  },
  {
    title: 'Finding Hope in Trials',
    scriptureReference: 'Romans 8:28-39',
    series: 'Romans: The Gospel Revealed',
    description: 'How God works all things together for good in our lives'
  },
  {
    title: 'The Great Commission',
    scriptureReference: 'Matthew 28:16-20',
    series: 'Called to Serve',
    description: 'Our calling to share the Gospel with the world'
  }
]

async function main() {
  console.log('🌱 Starting church database seeding...')

  // Clear existing data
  console.log('🧹 Clearing existing church data...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.donation.deleteMany()
  await prisma.fund.deleteMany()
  await prisma.blogPost.deleteMany()
  await prisma.newsPost.deleteMany()
  await prisma.prayerRequest.deleteMany()
  await prisma.eventRegistration.deleteMany()
  await prisma.event.deleteMany()
  await prisma.sermon.deleteMany()
  await prisma.ministry.deleteMany()
  await prisma.memberProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemSettings.deleteMany()

  // Create system settings
  console.log('⚙️ Creating church system settings...')
  await prisma.systemSettings.create({
    data: {
      churchName: 'Grace Community Church',
      churchAddress: '123 Faith Street, Springfield, IL 62701',
      churchPhone: '(555) 123-4567',
      churchEmail: 'info@gracechurch.org',
      churchWebsite: 'https://gracechurch.org',
      enableOnlineGiving: true,
      enableEventRegistration: true,
      enablePrayerRequests: true,
      maintenanceMode: false
    }
  })

  // Create users with different roles
  console.log('👥 Creating users...')
  const pastor = await prisma.user.create({
    data: {
      name: 'Pastor Michael Johnson',
      email: 'pastor@gracechurch.org',
      role: 'PASTOR',
      phone: '(555) 123-4567',
      address: '123 Church Street, Springfield, IL',
      isActive: true,
      joinDate: new Date('2020-01-01')
    }
  })

  const staff1 = await prisma.user.create({
    data: {
      name: 'Sarah Williams',
      email: 'sarah@gracechurch.org',
      role: 'STAFF',
      phone: '(555) 234-5678',
      address: '456 Faith Avenue, Springfield, IL',
      isActive: true,
      joinDate: new Date('2021-06-15')
    }
  })

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@gracechurch.org',
      role: 'ADMIN',
      phone: '(555) 345-6789',
      isActive: true,
      joinDate: new Date('2020-01-01')
    }
  })

  // Create regular members
  const members = []
  for (let i = 0; i < 20; i++) {
    const member = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: 'MEMBER',
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        isActive: faker.datatype.boolean(0.9),
        joinDate: faker.date.between({ from: new Date('2020-01-01'), to: new Date() })
      }
    })
    members.push(member)

    // Create member profile
    await prisma.memberProfile.create({
      data: {
        userId: member.id,
        emergencyContact: faker.person.fullName(),
        emergencyPhone: faker.phone.number(),
        baptismDate: faker.date.past({ years: 5 }),
        membershipDate: member.joinDate,
        skills: faker.helpers.arrayElements(['Music', 'Teaching', 'Administration', 'Technology', 'Counseling'], { min: 1, max: 3 }),
        interests: faker.helpers.arrayElements(['Prayer', 'Worship', 'Outreach', 'Youth Ministry', 'Missions'], { min: 1, max: 3 }),
        ministryInvolvement: faker.helpers.arrayElements(['Worship Team', 'Youth Ministry', 'Children\'s Ministry'], { min: 0, max: 2 })
      }
    })
  }

  // Create ministries
  console.log('⛪ Creating church ministries...')
  const createdMinistries = []
  for (const ministry of ministryTemplates) {
    const createdMinistry = await prisma.ministry.create({
      data: ministry
    })
    createdMinistries.push(createdMinistry)
  }

  // Create sample sermons
  console.log('🎤 Creating sample sermons...')
  for (const sermonTemplate of sampleSermons) {
    await prisma.sermon.create({
      data: {
        title: sermonTemplate.title,
        description: sermonTemplate.description,
        scriptureReference: sermonTemplate.scriptureReference,
        series: sermonTemplate.series,
        speaker: faker.helpers.arrayElement(['Pastor Michael Johnson', 'Sarah Williams', 'Guest Speaker']),
        date: faker.date.between({ 
          from: new Date('2024-01-01'), 
          to: new Date() 
        }),
        duration: `${faker.number.int({ min: 25, max: 45 })}:${faker.number.int({ min: 10, max: 59 })}`,
        isPublished: faker.datatype.boolean(0.8),
        views: faker.number.int({ min: 50, max: 500 }),
        audioUrl: faker.datatype.boolean(0.7) ? `/sermons/audio/${faker.string.uuid()}.mp3` : null,
        videoUrl: faker.datatype.boolean(0.5) ? `/sermons/video/${faker.string.uuid()}.mp4` : null,
        tags: faker.helpers.arrayElements(['Faith', 'Prayer', 'Love', 'Hope', 'Grace', 'Salvation'], { min: 1, max: 3 })
      }
    })
  }

  // Create sample events
  console.log('📅 Creating church events...')
  const eventTemplates = [
    {
      title: 'Sunday Worship Service',
      description: 'Join us for worship, prayer, and biblical teaching',
      location: 'Main Sanctuary',
      capacity: 500,
      category: 'Worship'
    },
    {
      title: 'Youth Lock-in',
      description: 'All-night fun and fellowship for teens',
      location: 'Fellowship Hall',
      capacity: 50,
      category: 'Youth'
    },
    {
      title: 'Women\'s Retreat',
      description: 'Weekend retreat for spiritual renewal and fellowship',
      location: 'Camp Galilee',
      capacity: 75,
      category: 'Adult'
    },
    {
      title: 'Vacation Bible School',
      description: 'Week-long adventure for kids ages 4-12',
      location: 'Children\'s Wing',
      capacity: 100,
      category: 'Children'
    },
    {
      title: 'Community Service Day',
      description: 'Serving our community with acts of love',
      location: 'Various Locations',
      capacity: 200,
      category: 'Outreach'
    }
  ]

  const createdEvents = []
  for (const eventTemplate of eventTemplates) {
    const event = await prisma.event.create({
      data: {
        ...eventTemplate,
        startDate: faker.date.future(),
        endDate: faker.date.future(),
        status: 'PUBLISHED',
        requiresRegistration: faker.datatype.boolean(0.7),
        registrationFee: faker.datatype.boolean(0.3) ? faker.number.float({ min: 5, max: 50, fractionDigits: 2 }) : null
      }
    })
    createdEvents.push(event)

    // Create some registrations
    const registrationCount = faker.number.int({ min: 0, max: Math.min(event.capacity || 50, 20) })
    for (let i = 0; i < registrationCount; i++) {
      const member = faker.helpers.arrayElement(members)
      try {
        await prisma.eventRegistration.create({
          data: {
            eventId: event.id,
            userId: member.id,
            attendees: faker.number.int({ min: 1, max: 4 })
          }
        })
      } catch (error) {
        // Skip if duplicate registration
      }
    }
  }

  // Create funds for giving
  console.log('💰 Creating donation funds...')
  const fundTemplates = [
    { name: 'General Fund', description: 'General church operations and ministry' },
    { name: 'Building Fund', description: 'Church building maintenance and expansion' },
    { name: 'Missions Fund', description: 'Supporting missionaries and global outreach' },
    { name: 'Youth Ministry', description: 'Youth programs and activities' },
    { name: 'Benevolence Fund', description: 'Helping families in need' }
  ]

  const createdFunds = []
  for (const fundTemplate of fundTemplates) {
    const fund = await prisma.fund.create({
      data: {
        ...fundTemplate,
        targetAmount: faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 })
      }
    })
    createdFunds.push(fund)
  }

  // Create donations
  console.log('💸 Creating donations...')
  for (let i = 0; i < 50; i++) {
    const fund = faker.helpers.arrayElement(createdFunds)
    const donor = faker.helpers.arrayElement([...members, null]) // Some anonymous donations
    
    await prisma.donation.create({
      data: {
        userId: donor?.id,
        fundId: fund.id,
        amount: faker.number.float({ min: 25, max: 1000, fractionDigits: 2 }),
        paymentMethod: faker.helpers.arrayElement(['CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'CASH']),
        transactionId: `TXN${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`,
        isRecurring: faker.datatype.boolean(0.3),
        recurringFrequency: faker.datatype.boolean(0.3) ? faker.helpers.arrayElement(['Weekly', 'Monthly', 'Quarterly']) : null,
        status: faker.helpers.arrayElement(['COMPLETED', 'PENDING']),
        donorName: donor?.name || 'Anonymous',
        donorEmail: donor?.email,
        createdAt: faker.date.between({ from: new Date('2024-01-01'), to: new Date() })
      }
    })
  }

  // Create news articles
  console.log('📰 Creating church news...')
  const newsTemplates = [
    {
      title: 'New Pastor Joins Our Team',
      content: 'We are excited to welcome Pastor Sarah Martinez to our pastoral team. She brings 15 years of ministry experience and a heart for discipleship. Pastor Sarah will be leading our youth ministry and helping with pastoral care. We believe God has great things in store as she joins our leadership team.',
      excerpt: 'Welcoming Pastor Sarah Martinez to our ministry team'
    },
    {
      title: 'Easter Service Schedule',
      content: 'Join us for special Easter services as we celebrate the resurrection of Jesus Christ. We will have services at 8:00 AM, 10:00 AM, and 6:00 PM. Each service will include special music, communion, and a powerful message about the hope we have in Christ. Invite your friends and family to celebrate with us!',
      excerpt: 'Special Easter celebration services this Sunday'
    },
    {
      title: 'Mission Trip to Guatemala',
      content: 'Our missions team is planning a trip to Guatemala this summer to build homes and share the Gospel. Applications are now available in the church office. This will be a life-changing experience where we partner with local churches to serve the community. The trip is scheduled for July 15-22.',
      excerpt: 'Summer mission trip opportunities available'
    },
    {
      title: 'New Children\'s Ministry Wing Opens',
      content: 'We are thrilled to announce the opening of our new children\'s ministry wing! This beautiful space includes age-appropriate classrooms, a playground, and a nursery. Our children deserve the best environment to learn about Jesus, and this new facility provides exactly that.',
      excerpt: 'New dedicated space for our youngest members'
    }
  ]

  for (const newsTemplate of newsTemplates) {
    await prisma.newsPost.create({
      data: {
        ...newsTemplate,
        authorId: faker.helpers.arrayElement([pastor.id, staff1.id]),
        isPublished: faker.datatype.boolean(0.8),
        publishDate: faker.date.recent({ days: 30 }),
        tags: faker.helpers.arrayElements(['Announcement', 'Ministry', 'Events', 'Community'], { min: 1, max: 3 })
      }
    })
  }

  // Create blog posts
  console.log('📝 Creating blog posts...')
  const blogTemplates = [
    {
      title: 'Walking in Faith During Difficult Times',
      content: 'Life is full of challenges that test our faith and resolve. In times of uncertainty, we often wonder where God is and whether He truly cares about our struggles. The truth is, God is always with us, even in our darkest moments. Faith is not the absence of doubt, but trusting God despite our circumstances. When we walk by faith, we learn to see beyond our immediate situation and trust in God\'s perfect plan for our lives.',
      excerpt: 'How to maintain your faith when life gets challenging and uncertain',
      slug: 'walking-in-faith-during-difficult-times'
    },
    {
      title: 'The Power of Community Prayer',
      content: 'There is something powerful that happens when believers come together in prayer. Corporate prayer connects us not only to God but to one another in ways that individual prayer cannot. When we pray together, we share burdens, celebrate victories, and experience the unity that Christ desires for His church. The early church understood this principle and devoted themselves to prayer together regularly.',
      excerpt: 'Discovering the strength that comes from praying together as a community',
      slug: 'the-power-of-community-prayer'
    },
    {
      title: 'Serving Others with Joy',
      content: 'Service is at the heart of the Christian life. Jesus came not to be served, but to serve others and give His life as a ransom for many. When we serve others with genuine love and joy, we reflect the character of Christ to the world. Service is not just about helping others; it\'s about becoming more like Jesus. Every act of service, no matter how small, has the potential to transform both the giver and the receiver.',
      excerpt: 'Finding fulfillment through selfless service to others',
      slug: 'serving-others-with-joy'
    }
  ]

  for (const blogTemplate of blogTemplates) {
    await prisma.blogPost.create({
      data: {
        ...blogTemplate,
        authorId: faker.helpers.arrayElement([pastor.id, staff1.id]),
        isPublished: faker.datatype.boolean(0.7),
        publishDate: faker.date.recent({ days: 60 }),
        views: faker.number.int({ min: 50, max: 800 }),
        tags: faker.helpers.arrayElements(['Faith', 'Community', 'Service', 'Prayer', 'Encouragement'], { min: 1, max: 3 })
      }
    })
  }

  // Create products for bookstore
  console.log('📦 Creating church bookstore products...')
  const christianProducts = [
    // Books
    { name: 'Jesus Calling', category: 'BOOK', price: 16.99, description: 'Daily devotional by Sarah Young with Scripture and personal reflections' },
    { name: 'The Purpose Driven Life', category: 'BOOK', price: 14.99, description: 'Rick Warren\'s bestselling book about discovering your purpose' },
    { name: 'Mere Christianity', category: 'BOOK', price: 13.99, description: 'C.S. Lewis classic defense of the Christian faith' },
    { name: 'The Case for Christ', category: 'BOOK', price: 15.99, description: 'Lee Strobel\'s investigation into the evidence for Jesus' },
    
    // Music
    { name: 'Hillsong United - Wonder', category: 'MUSIC', price: 12.99, description: 'Latest worship album from Hillsong United' },
    { name: 'Chris Tomlin - Holy Roar', category: 'MUSIC', price: 11.99, description: 'Inspiring worship songs for personal and corporate worship' },
    { name: 'Lauren Daigle - Look Up Child', category: 'MUSIC', price: 13.99, description: 'Grammy-winning album with powerful vocals and lyrics' },
    
    // Study Materials
    { name: 'Life Application Study Bible', category: 'STUDY_MATERIALS', price: 39.99, description: 'NIV Study Bible with practical application notes' },
    { name: 'My Utmost for His Highest', category: 'STUDY_MATERIALS', price: 12.99, description: 'Classic Oswald Chambers devotional for deeper spiritual growth' },
    { name: 'Inductive Bible Study Kit', category: 'STUDY_MATERIALS', price: 24.99, description: 'Complete tools for systematic Bible study' },
    
    // Gifts
    { name: 'Sterling Silver Cross Necklace', category: 'GIFTS', price: 49.99, description: 'Beautiful handcrafted silver cross pendant' },
    { name: 'Wooden Cross Wall Decor', category: 'GIFTS', price: 34.99, description: 'Rustic wooden cross for home decoration' },
    { name: 'Faith Hope Love Canvas', category: 'GIFTS', price: 24.99, description: 'Inspirational wall art for home or office' }
  ]

  for (const productTemplate of christianProducts) {
    await prisma.product.create({
      data: {
        name: productTemplate.name,
        description: productTemplate.description,
        price: productTemplate.price,
        category: productTemplate.category as any,
        stockQuantity: faker.number.int({ min: 5, max: 100 }),
        isActive: faker.datatype.boolean(0.9),
        tags: faker.helpers.arrayElements(['Popular', 'New Arrival', 'Bestseller', 'Gift Idea'], { min: 0, max: 2 })
      }
    })
  }

  // Create prayer requests
  console.log('🙏 Creating prayer requests...')
  const prayerTemplates = [
    'Healing for church member recovering from surgery',
    'Wisdom for church leadership decisions and future planning',
    'Peace for families facing financial difficulties',
    'Safety for missionaries serving in difficult regions',
    'Unity and continued growth for our church family',
    'Comfort for family grieving the loss of a loved one',
    'Guidance for students making important life decisions',
    'Strength for those battling illness and health challenges'
  ]

  for (const prayer of prayerTemplates) {
    const requester = faker.helpers.arrayElement([...members, null])
    await prisma.prayerRequest.create({
      data: {
        userId: requester?.id,
        name: requester?.name || 'Anonymous',
        email: requester?.email,
        request: prayer,
        isAnonymous: faker.datatype.boolean(0.3),
        isUrgent: faker.datatype.boolean(0.2),
        status: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'ANSWERED'])
      }
    })
  }

  // Get final counts
  const userCount = await prisma.user.count()
  const ministryCount = await prisma.ministry.count()
  const sermonCount = await prisma.sermon.count()
  const eventCount = await prisma.event.count()
  const newsCount = await prisma.newsPost.count()
  const blogCount = await prisma.blogPost.count()
  const productCount = await prisma.product.count()
  const donationCount = await prisma.donation.count()
  const prayerCount = await prisma.prayerRequest.count()

  console.log('\n🎉 Church database seeding completed successfully!')
  console.log(`👥 Users created: ${userCount}`)
  console.log(`⛪ Ministries created: ${ministryCount}`)
  console.log(`🎤 Sermons created: ${sermonCount}`)
  console.log(`📅 Events created: ${eventCount}`)
  console.log(`📰 News articles created: ${newsCount}`)
  console.log(`📝 Blog posts created: ${blogCount}`)
  console.log(`📦 Products created: ${productCount}`)
  console.log(`💰 Donations created: ${donationCount}`)
  console.log(`🙏 Prayer requests created: ${prayerCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during church seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
