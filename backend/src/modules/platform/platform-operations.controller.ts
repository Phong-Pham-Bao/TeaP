import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { CorrelationId } from '../../common/decorators/correlation-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import {
  DeadLetterPageResponseDto,
  PlatformMetricsResponseDto,
  QueryDeadLettersDto,
  ReplayOutboxDto,
  ReplayOutboxResponseDto,
  RetentionCleanupResponseDto,
  RunRetentionCleanupDto,
} from './dto/platform-operations.dto';
import { PlatformOperationsService } from './platform-operations.service';

@ApiTags('Platform Operations')
@ApiBearerAuth('JWT-auth')
@Controller('platform')
export class PlatformOperationsController {
  constructor(private readonly operations: PlatformOperationsService) {}

  @Get('operations/metrics')
  @RequirePermissions(PERMISSIONS.PLATFORM_OPERATIONS_READ)
  @ApiOperation({ summary: 'Read outbox backlog and dead-letter metrics' })
  @ApiOkResponse({ type: PlatformMetricsResponseDto })
  getMetrics(@CurrentUser() actor: AuthenticatedActor) {
    return this.operations.getMetrics(actor);
  }

  @Get('outbox/dead-letters')
  @RequirePermissions(PERMISSIONS.PLATFORM_OPERATIONS_READ)
  @ApiOperation({ summary: 'List dead-letter events using cursor pagination' })
  @ApiOkResponse({ type: DeadLetterPageResponseDto })
  findDeadLetters(
    @Query() query: QueryDeadLettersDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.operations.findDeadLetters(query, actor);
  }

  @Post('outbox/:id/replay')
  @RequirePermissions(PERMISSIONS.PLATFORM_OUTBOX_REPLAY)
  @ApiOperation({
    summary: 'Replay one dead-letter event with an audit reason',
  })
  @ApiOkResponse({ type: ReplayOutboxResponseDto })
  replayDeadLetter(
    @Param('id') id: string,
    @Body() dto: ReplayOutboxDto,
    @CurrentUser() actor: AuthenticatedActor,
    @CorrelationId() correlationId: string,
  ) {
    return this.operations.replayDeadLetter(
      id,
      dto.reason,
      actor,
      correlationId,
    );
  }

  @Post('retention/cleanup')
  @RequirePermissions(PERMISSIONS.PLATFORM_RETENTION_RUN)
  @ApiOperation({
    summary: 'Delete one bounded batch of expired platform data',
  })
  @ApiOkResponse({ type: RetentionCleanupResponseDto })
  runRetentionCleanup(
    @Body() dto: RunRetentionCleanupDto,
    @CurrentUser() actor: AuthenticatedActor,
    @CorrelationId() correlationId: string,
  ) {
    return this.operations.runRetentionCleanup(dto, actor, correlationId);
  }
}
