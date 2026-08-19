import {
  listOrganizations as listOrganizationsService,
  getOrganizationById as getOrganizationByIdService,
  getPlatformStats as getPlatformStatsService,
  createOrganization as createOrganizationService,
  deleteOrganization as deleteOrganizationService
} from "../services/organizationService.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("organizationController");

export const listOrganizations = async (req, res, next) => {
  try {
    const orgs = await listOrganizationsService();
    log.debug(`Listed ${orgs.length} organizations`);
    res.json(orgs);
  } catch (err) {
    next(err);
  }
};

export const getOrganization = async (req, res, next) => {
  try {
    const org = await getOrganizationByIdService(req.params.orgId);
    res.json(org);
  } catch (err) {
    next(err);
  }
};

import { getChatbotUsageStats as getChatbotUsageStatsService } from "../services/chatbotUsageService.js";

export const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await getPlatformStatsService();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const getChatbotUsageStats = async (req, res, next) => {
  try {
    const stats = await getChatbotUsageStatsService();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const createOrganization = async (req, res, next) => {
  try {
    const { name } = req.body;

    const org = await createOrganizationService({ name });
    res.status(201).json(org);
  } catch (err) {
    next(err);
  }
};

export const deleteOrganization = async (req, res, next) => {
  try {
    const { orgId } = req.params;

    await deleteOrganizationService({ orgId });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
