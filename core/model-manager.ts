/**
 * 模型管理模块
 * 负责加载、缓存嵌入模型
 */

import { pipeline, type FeatureExtractionPipeline, env } from '@huggingface/transformers';

if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.cacheDir = 'cache';

const MODEL_NAME = 'Xenova/gte-small';

export type ModelProgress = {
  loaded: number;
  total: number;
  file: string;
};

export class ModelManager {
  private embeddingPipeline: FeatureExtractionPipeline | null = null;
  private loadPromise: Promise<void> | null = null;

  isLoaded(): boolean {
    return this.embeddingPipeline !== null;
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
