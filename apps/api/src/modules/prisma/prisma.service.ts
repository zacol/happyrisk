import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

    super({ adapter });

    Object.assign(
      this,
      this.$extends({
        query: {
          slackInstallation: {
            $allOperations({
              operation,
              args,
              query,
            }: {
              operation: string;
              args: unknown;
              query: (args: unknown) => Promise<unknown>;
            }): Promise<unknown> {
              type WriteArgs = {
                data?: { botToken?: unknown };
                create?: { botToken?: unknown };
                update?: { botToken?: unknown };
              };

              const a = args as WriteArgs;
              const tokensToCheck: unknown[] = [];

              if (operation === 'upsert') {
                tokensToCheck.push(a.create?.botToken, a.update?.botToken);
              } else if (operation === 'create' || operation === 'update') {
                tokensToCheck.push(a.data?.botToken);
              }

              for (const token of tokensToCheck) {
                if (typeof token === 'string' && token.startsWith('xoxb-')) {
                  throw new Error(
                    'botToken must be encrypted before persisting to SlackInstallation',
                  );
                }
              }

              return query(args);
            },
          },
        },
      }),
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
