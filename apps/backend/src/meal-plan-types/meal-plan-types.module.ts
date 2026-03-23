import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MealPlanTypesController } from './meal-plan-types.controller';
import { MealPlanTypesService } from './meal-plan-types.service';

@Module({
  imports: [PrismaModule],
  controllers: [MealPlanTypesController],
  providers: [MealPlanTypesService],
  exports: [MealPlanTypesService],
})
export class MealPlanTypesModule {}
