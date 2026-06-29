/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FastifyPluginAsync } from 'fastify';
import { verifyAccessToken } from '@/core/auth.js';
import type { RuntimeServices } from '@/runtime.js';

export const dashboardWebSocketRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: 'GET',
    url: '/ws/dashboard',
    websocket: true,
    handler: (connection: any, request: any) => {
      const authHeader = request.headers?.authorization;
      const tokenFromHeader =
        typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : undefined;
      const tokenFromQuery =
        typeof request.query?.token === 'string' ? request.query.token : undefined;
      const token = tokenFromHeader ?? tokenFromQuery;

      if (!token) {
        connection.socket.close(1008, 'Missing auth token');
        return;
      }

      const payload = verifyAccessToken(token);
      if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
        connection.socket.close(1008, 'Invalid auth token');
        return;
      }

      const services = (fastify as typeof fastify & { runtimeServices?: RuntimeServices })
        .runtimeServices;
      if (!services) {
        connection.socket.close(1011, 'Runtime unavailable');
        return;
      }

      const socket = connection.socket ?? connection;
      const eventBus = services.opportunityEngine.getEventBus();

      const sendJson = (payload: unknown) => {
        if (socket?.readyState === 1) {
          socket.send(JSON.stringify(payload));
        }
      };

      sendJson({
        type: 'dashboard.connected',
        payload: {
          opportunityCount: services.opportunityEngine.getValidatedOpportunities().length,
        },
      });

      const unsubscribe = eventBus.subscribe('scanner.opportunity.validated', (event) => {
        const opportunity = event.payload as { id?: string; symbol?: string };
        sendJson({
          type: 'opportunity.validated',
          payload: { id: opportunity.id, symbol: opportunity.symbol },
        });
      });

      socket.on('close', () => {
        unsubscribe();
      });
    },
  } as any);
};
