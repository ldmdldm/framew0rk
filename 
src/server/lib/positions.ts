      const positionMetrics = await metrics.getUserMetrics(protocol_id, userId);

      // Ensure positionMetrics is compatible with PositionMetrics interface
      const typedMetrics: PositionMetrics = {
        value: positionMetrics.value?.toString() || '0',
        pnl: positionMetrics.pnl?.toString() || '0',
        apy: typeof positionMetrics.apy === 'number' ? positionMetrics.apy : 0,
        ...positionMetrics
      };

      return {
        position: position as Position,
        metrics: typedMetrics,
      };
      const positionMetrics = await metrics.getUserMetrics(position.protocol_id, userId);

      // Ensure positionMetrics is compatible with PositionMetrics interface
      const typedMetrics: PositionMetrics = {
        value: positionMetrics.value?.toString() || '0',
        pnl: positionMetrics.pnl?.toString() || '0',
        apy: typeof positionMetrics.apy === 'number' ? positionMetrics.apy : 0,
        ...positionMetrics
      };

      return {
        position: updatedPosition as Position,
        metrics: typedMetrics,
      };
