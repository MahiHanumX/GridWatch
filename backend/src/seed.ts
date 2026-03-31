// @ts-ignore
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding data with Prisma...');
  
  try {
    // 1. Zones
    const zones = ['North Zone', 'South Zone', 'East Zone'];
    const zoneIds: string[] = [];
    
    for (const z of zones) {
      const zone = await prisma.zone.create({
        data: { name: z }
      });
      zoneIds.push(zone.id);
    }

    // 2. Users
    await prisma.user.create({
      data: {
        username: 'admin_supervisor',
        role: 'supervisor'
      }
    });
    
    await prisma.user.createMany({
      data: [
        {
          username: 'operator_north',
          role: 'operator',
          zoneId: zoneIds[0]
        },
        {
          username: 'operator_south',
          role: 'operator',
          zoneId: zoneIds[1]
        }
      ]
    });

    // 3. Sensors (1000)
    let sensorData = [];
    let count = 0;
    for (let i = 0; i < 3; i++) {
        // Distribute ~1000 sensors
        const numSensors = i === 2 ? 334 : 333; 
        for (let j = 0; j < numSensors; j++) {
            count++;
            sensorData.push({
              zoneId: zoneIds[i],
              name: `Sensor-${count}`,
              ruleAMinVoltage: 200,
              ruleAMaxVoltage: 240,
              ruleAMinTemp: 10,
              ruleAMaxTemp: 80,
              ruleBChangeThreshold: 10
            });
        }
    }

    await prisma.sensor.createMany({
      data: sensorData
    });

    const createdSensors = await prisma.sensor.findMany();
    const sensorIds = createdSensors.map((s: any) => s.id);

    // 4. Sample Readings spanning 48 hours (sparse to save time)
    // We will generate 5 readings per sensor over the last 48 hours
    console.log(`Created ${sensorIds.length} sensors. Generating readings...`);
    const now = new Date();
    
    let readingData = [];
    for (const sid of sensorIds) {
        for (let r = 0; r < 5; r++) {
            const time = new Date(now.getTime() - (Math.random() * 48 * 60 * 60 * 1000));
            // healthy reading
            readingData.push({
              sensorId: sid,
              voltage: 220,
              current: 15,
              temperature: 45,
              statusCode: 200,
              timestamp: time
            });
        }
    }
    
    // Chunk insert to avoid hitting query limits
    const chunkSize = 1000;
    for (let i = 0; i < readingData.length; i += chunkSize) {
        const chunk = readingData.slice(i, i + chunkSize);
        await prisma.reading.createMany({
          data: chunk
        });
    }

    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
