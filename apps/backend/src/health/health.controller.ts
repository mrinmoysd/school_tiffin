import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Health Check Controller
 * Provides endpoints for monitoring system health
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prisma: PrismaService,
  ) {}

  /**
   * Overall health check
   * Checks database, memory, and disk
   */
  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Overall system health check',
    description: 'Comprehensive health check including database, memory, and disk. Used by monitoring systems and load balancers.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: {
            status: 'up'
          },
          memory_heap: {
            status: 'up'
          },
          memory_rss: {
            status: 'up'
          },
          disk: {
            status: 'up'
          }
        },
        error: {},
        details: {
          database: {
            status: 'up'
          },
          memory_heap: {
            status: 'up'
          },
          memory_rss: {
            status: 'up'
          },
          disk: {
            status: 'up'
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'System is unhealthy - one or more services down',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Connection failed'
          }
        },
        details: {
          database: {
            status: 'down',
            message: 'Connection failed'
          }
        }
      }
    }
  })
  check() {
    return this.health.check([
      // Database health
      () => this.prismaHealth.pingCheck('database', this.prisma),
      
      // Memory health (heap should be below 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // Memory health (RSS should be below 150MB)
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      
      // Disk health (should have at least 50% free space)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.5,
        }),
    ]);
  }

  /**
   * Readiness probe
   * Kubernetes/load balancer can check if app is ready to receive traffic
   */
  @Get('/readiness')
  @Public()
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Readiness probe for load balancers',
    description: 'Used by load balancers and Kubernetes to determine if the app can handle requests. Checks critical dependencies like database.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is ready to receive traffic',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: {
            status: 'up'
          }
        },
        error: {},
        details: {
          database: {
            status: 'up'
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Application is not ready - critical services unavailable',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Connection refused'
          }
        },
        details: {
          database: {
            status: 'down',
            message: 'Connection refused'
          }
        }
      }
    }
  })
  readiness() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      // Add Redis check here when implemented
    ]);
  }

  /**
   * Liveness probe
   * Kubernetes can check if app is alive
   */
  @Get('/liveness')
  @Public()
  @HealthCheck()
  @ApiOperation({ 
    summary: 'Liveness probe for container orchestration',
    description: 'Used by Kubernetes to detect if the application needs to be restarted. Returns basic app info and uptime.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is alive and running',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-02-06T15:30:00.000Z',
        uptime: 3600.5
      }
    }
  })
  async liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
