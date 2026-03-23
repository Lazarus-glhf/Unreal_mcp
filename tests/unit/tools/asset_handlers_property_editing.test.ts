import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ITools } from '../../../src/types/tool-interfaces.js';

vi.mock('../../../src/tools/handlers/common-handlers.js', () => ({
  executeAutomationRequest: vi.fn()
}));

import { handleAssetTools } from '../../../src/tools/handlers/asset-handlers.js';
import { executeAutomationRequest } from '../../../src/tools/handlers/common-handlers.js';

describe('Asset property editing handlers', () => {
  const mockExecuteAutomationRequest = vi.mocked(executeAutomationRequest);
  let mockTools: ITools;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTools = {
      automationBridge: {
        isConnected: vi.fn().mockReturnValue(true),
        sendAutomationRequest: vi.fn()
      }
    } as unknown as ITools;
  });

  it('routes inspect_asset_properties to inspect_asset', async () => {
    mockExecuteAutomationRequest.mockResolvedValue({ success: true, propertyCount: 4 });

    const result = await handleAssetTools('inspect_asset_properties', {
      assetPath: '/Game/Test/DA_Test',
      depth: 2,
      includeDefaults: true
    }, mockTools);

    expect(mockExecuteAutomationRequest).toHaveBeenCalledWith(mockTools, 'inspect_asset', {
      assetPath: '/Game/Test/DA_Test',
      depth: 2,
      includeTransient: undefined,
      includeDefaults: true,
      propertyFilter: undefined,
      categoryFilter: undefined
    });
    expect(result).toEqual({ success: true, propertyCount: 4 });
  });

  it('routes get_asset_property through inspect get_property', async () => {
    mockExecuteAutomationRequest.mockResolvedValue({ success: true, value: '/Game/Test/M_Test' });

    const result = await handleAssetTools('get_asset_property', {
      assetPath: '/Game/Test/DA_Test',
      propertyPath: 'LookAtReaction.Anim'
    }, mockTools);

    expect(mockExecuteAutomationRequest).toHaveBeenCalledWith(mockTools, 'inspect', {
      action: 'get_property',
      objectPath: '/Game/Test/DA_Test',
      propertyName: 'LookAtReaction.Anim'
    });
    expect(result).toEqual({
      success: true,
      value: '/Game/Test/M_Test',
      assetPath: '/Game/Test/DA_Test',
      propertyPath: 'LookAtReaction.Anim'
    });
  });

  it('routes set_asset_property through inspect and save_asset by default', async () => {
    mockExecuteAutomationRequest
      .mockResolvedValueOnce({ success: true, value: '/Game/Test/M_New' })
      .mockResolvedValueOnce({ success: true, saved: true });

    const result = await handleAssetTools('set_asset_property', {
      assetPath: '/Game/Test/DA_Test',
      propertyPath: 'LookAtReaction.Anim',
      value: '/Game/Test/M_New'
    }, mockTools);

    expect(mockExecuteAutomationRequest).toHaveBeenNthCalledWith(1, mockTools, 'inspect', {
      action: 'set_property',
      objectPath: '/Game/Test/DA_Test',
      propertyName: 'LookAtReaction.Anim',
      value: '/Game/Test/M_New'
    });
    expect(mockExecuteAutomationRequest).toHaveBeenNthCalledWith(2, mockTools, 'save_asset', {
      assetPath: '/Game/Test/DA_Test'
    });
    expect(result).toEqual({
      success: true,
      value: '/Game/Test/M_New',
      assetPath: '/Game/Test/DA_Test',
      propertyPath: 'LookAtReaction.Anim',
      saved: true,
      save: { success: true, saved: true }
    });
  });

  it('preserves save_asset failures instead of wrapping them as success', async () => {
    mockExecuteAutomationRequest.mockResolvedValue({
      success: false,
      error: 'SAVE_FAILED',
      message: 'Disk write failed'
    });

    const result = await handleAssetTools('save_asset', {
      assetPath: '/Game/Test/DA_Test'
    }, mockTools);

    expect(result).toEqual({
      success: false,
      error: 'SAVE_FAILED',
      message: 'Disk write failed'
    });
  });

  it('requires value for set_asset_property', async () => {
    await expect(handleAssetTools('set_asset_property', {
      assetPath: '/Game/Test/DA_Test',
      propertyPath: 'LookAtReaction.Anim'
    }, mockTools)).rejects.toThrow('Missing required argument: value');
  });

  it('routes resolve_reference directly through inspect_object', async () => {
    mockExecuteAutomationRequest.mockResolvedValue({
      success: true,
      objectPath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'"
    });

    const result = await handleAssetTools('resolve_reference', {
      referencePath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'"
    }, mockTools);

    expect(mockExecuteAutomationRequest).toHaveBeenCalledTimes(1);
    expect(mockExecuteAutomationRequest).toHaveBeenCalledWith(mockTools, 'inspect', {
      action: 'inspect_object',
      objectPath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'"
    });
    expect(result).toEqual({
      success: true,
      objectPath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'",
      exists: true,
      referencePath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'"
    });
  });
});
