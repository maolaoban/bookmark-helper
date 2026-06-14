/**
 * 模型管理模块
 * 负责加载、缓存嵌入模型
 */

import { pipeline, type FeatureExtractionPipeline, env } from '@huggingface/transformers';

if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.proxy = true;
}

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.cacheDir = 'cache';

const HUGGINGFACE_HOST = 'https://huggingface.co';
const MIRROR_HOST = 'https://hf-mirror.com';

const MODEL_NAME = 'Xenova/gte-small';

export type ModelProgress = {
  loaded: number;
  total: number;
  file: string;
};

export class ModelManager {
  private embeddingPipeline: FeatureExtractionPipeline | null = null;
  private loadPromise: Promise<void> | null = null;
  private static remoteHostResolved = false;

  isLoaded(): boolean {
    return this.embeddingPipeline !== null;
  }

  private static async resolveRemoteHost(): Promise<void> {
    if (ModelManager.remoteHostResolved) return;
    ModelManager.remoteHostResolved = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch(`${HUGGINGFACE_HOST}/api/models/${MODEL_NAME}`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      env.remoteHost = HUGGINGFACE_HOST;
      console.log('[ModelManager] 使用 HuggingFace 原站');
    } catch {
      env.remoteHost = MIRROR_HOST;
      console.log('[ModelManager] HuggingFace 不可达，使用镜像站');
    }
  }

  async loadModel(onProgress?: (progress: ModelProgress) => void): Promise<void> {
    if (this.embeddingPipeline) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        await ModelManager.resolveRemoteHost();
        console.log('[ModelManager] 加载嵌入模型:', MODEL_NAME);
        this.embeddingPipeline = await pipeline(
          'feature-extraction',
          MODEL_NAME,
          {
            progress_callback: (info) => {
              if ('loaded' in info && 'total' in info) {
                onProgress?.({
                  loaded: info.loaded,
                  total: info.total,
                  file: 'file' in info ? info.file : '',
                });
              }
            },
          }
        );
        console.log('[ModelManager] 模型加载完成');
      } catch (error) {
        console.error('[ModelManager] 模型加载失败:', error);
        throw error;
      }
    })();

    return this.loadPromise;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      await this.loadModel();
    }

    if (!this.embeddingPipeline) {
      throw new Error('模型未加载');
    }

    const processedText = text.trim().toLowerCase();
    const output = await this.embeddingPipeline(processedText, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(output.data) as number[];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  dispose(): void {
    if (this.embeddingPipeline) {
      this.embeddingPipeline = null;
      console.log('[ModelManager] 模型已释放');
    }
  }
}

export default ModelManager;
