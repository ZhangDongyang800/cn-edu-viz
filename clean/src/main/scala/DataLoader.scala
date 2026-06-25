import org.apache.spark.sql.SparkSession

object DataLoader {
  def main(args: Array[String]): Unit = {
    val spark = SparkSession.builder()
      .appName("EducationDataAnalysis")
      .master("local[*]")
      .getOrCreate()

    val inputPath = "C:\\Users\\28751\\OneDrive\\桌面\\education_bigdata_project\\cn-edu-viz-main\\resource\\分省年度数据-普通、职业高等学校数（所）.csv"
    val outputPath = "C:\\Users\\28751\\IdeaProjects\\education_analysis\\03_结果数据\\学校数_清洗后"

    val df = spark.read
      .option("header", "true")
      .option("encoding", "UTF-8")
      .option("multiLine", "true")
      .csv(inputPath)

    println(s"总行数: ${df.count()}")

    df.coalesce(1)
      .write
      .mode("overwrite")
      .option("header", "true")
      .option("encoding", "UTF-8")
      .csv(outputPath)

    println(s"数据已保存到: $outputPath")

    spark.stop()
  }
}