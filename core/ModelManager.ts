/**
 * 模型管理模块
 * 负责加载、缓存嵌入模型
 */

import { pipeline, Pipeline, env } from '@xenova/transformers';

env.backends.onnx.wasm.numThreads = 1;

const MODEL_NAME = 'Xenova/gte-small';

class ModelManager {
  private static instance: ModelManager;
  private embeddingPipeline: Pipeline | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() { }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  /**
   * 获取模型加载状态
   */
  isLoaded(): boolean {
    return this.embeddingPipeline !== null;
  }

  /**
   * 加载嵌入模型
   */
  async loadModel(): Promise<void> {
    // 如果已经加载，直接返回
    if (this.embeddingPipeline) {
      return;
    }

    // 如果正在加载，等待加载完成
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        console.log('[ModelManager] 加载嵌入模型:', MODEL_NAME);
        this.embeddingPipeline = await pipeline(
          'feature-extraction',
          MODEL_NAME,
          {
            quantized: true,
            progress_callback: (progress: any) => {
              console.log(`[ModelManager] 下载进度: ${Math.round(progress.progress * 100)}%`)
            }
          }
        );
        console.log('[ModelManager] 模型加载完成');
      } catch (error) {
        console.error('[ModelManager] 模型加载失败:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    })();

    return this.loadPromise;
  }

  /**
   * 生成文本嵌入向量
   * @param text - 输入文本
   * @returns 嵌入向量数组
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      await this.loadModel();
    }

    if (!this.embeddingPipeline) {
      throw new Error('模型未加载');
    }

    // 对文本进行预处理
    const processedText = text.trim().toLowerCase();

    // 生成嵌入向量
    const output = await this.embeddingPipeline(processedText, {
      pooling: 'mean',
      normalize: true,
    });

    // 转换为普通数组
    return Array.from(output.data) as number[];
  }

  /**
   * 批量生成嵌入向量
   * @param texts - 文本数组
   * @returns 嵌入向量数组
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * 释放模型资源
   */
  dispose(): void {
    if (this.embeddingPipeline) {
      this.embeddingPipeline = null;
      console.log('[ModelManager] 模型已释放');
    }
  }
}

export default ModelManager;