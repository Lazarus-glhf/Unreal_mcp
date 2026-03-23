import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetTools } from '../../../src/tools/assets';
import { UnrealBridge } from '../../../src/unreal-bridge';

describe('AssetTools property APIs', () => {
  const sendAutomationRequest = vi.fn();
  const automationBridge = {
    isConnected: vi.fn(() => true),
    sendAutomationRequest
  };

  let bridge: UnrealBridge;
  let assetTools: AssetTools;

  beforeEach(() => {
    vi.clearAllMocks();
    bridge = {
      getAutomationBridge: vi.fn(() => automationBridge)
    } as unknown as UnrealBridge;
    assetTools = new AssetTools(bridge);
  });

  it('sends propertyName for getAssetProperty inspect requests', async () => {
    sendAutomationRequest.mockResolvedValue({
      success: true,
      result: { success: true, value: '/Game/Test/M_Test' }
    });

    const result = await assetTools.getAssetProperty({
      assetPath: '/Game/Test/DA_Test',
      propertyPath: 'LookAtReaction.Anim'
    });

    expect(sendAutomationRequest).toHaveBeenCalledWith(
      'inspect',
      {
        action: 'get_property',
        objectPath: '/Game/Test/DA_Test',
        propertyName: 'LookAtReaction.Anim',
        propertyPath: 'LookAtReaction.Anim'
      },
      { timeoutMs: 60000 }
    );
    expect(result).toEqual({ success: true, value: '/Game/Test/M_Test' });
  });

  it('sends propertyName for setAssetProperty inspect requests', async () => {
    sendAutomationRequest
      .mockResolvedValueOnce({
        success: true,
        result: { success: true, value: '/Game/Test/M_New' }
      })
      .mockResolvedValueOnce({
        success: true,
        saved: true,
        message: 'Asset saved'
      });

    const result = await assetTools.setAssetProperty({
      assetPath: '/Game/Test/DA_Test',
      propertyPath: 'LookAtReaction.Anim',
      value: '/Game/Test/M_New'
    });

    expect(sendAutomationRequest).toHaveBeenNthCalledWith(
      1,
      'inspect',
      {
        action: 'set_property',
        objectPath: '/Game/Test/DA_Test',
        propertyName: 'LookAtReaction.Anim',
        propertyPath: 'LookAtReaction.Anim',
        value: '/Game/Test/M_New'
      },
      { timeoutMs: 60000 }
    );
    expect(sendAutomationRequest).toHaveBeenNthCalledWith(
      2,
      'manage_asset',
      {
        assetPath: '/Game/Test/DA_Test',
        subAction: 'save_asset'
      },
      { timeoutMs: 60000 }
    );
    expect(result).toMatchObject({
      success: true,
      value: '/Game/Test/M_New',
      saved: true
    });
  });

  it('resolves references without coercing them into asset paths', async () => {
    sendAutomationRequest.mockResolvedValue({
      success: true,
      result: { success: true, objectPath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'" }
    });

    const result = await assetTools.resolveReference({
      referencePath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'"
    });

    expect(sendAutomationRequest).toHaveBeenCalledWith(
      'inspect',
      {
        action: 'inspect_object',
        objectPath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'"
      },
      { timeoutMs: 60000 }
    );
    expect(result).toEqual({
      success: true,
      objectPath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'",
      exists: true,
      referencePath: "BlueprintGeneratedClass'/Game/Test/BP_Test.BP_Test_C'",
      message: 'Reference resolved'
    });
  });

  it('returns structured not-found data for unresolved references', async () => {
    sendAutomationRequest.mockResolvedValue({
      success: false,
      error: 'OBJECT_NOT_FOUND',
      message: 'Object not found'
    });

    const result = await assetTools.resolveReference({
      referencePath: "BlueprintGeneratedClass'/Game/Test/Missing.Missing_C'"
    });

    expect(result).toEqual({
      success: false,
      error: 'OBJECT_NOT_FOUND',
      message: 'Object not found',
      exists: false,
      referencePath: "BlueprintGeneratedClass'/Game/Test/Missing.Missing_C'"
    });
  });

  it('requires value before sending setAssetProperty requests', async () => {
    await expect(assetTools.setAssetProperty({
      assetPath: '/Game/Test/DA_Test',
      propertyPath: 'LookAtReaction.Anim'
    } as unknown as Parameters<typeof assetTools.setAssetProperty>[0])).rejects.toThrow('setAssetProperty requires a value');

    expect(sendAutomationRequest).not.toHaveBeenCalled();
  });
});
