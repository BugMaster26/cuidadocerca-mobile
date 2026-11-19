package expo.modules.cuidados

import android.os.Build
import android.telephony.SmsManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CuidadoSosModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CuidadoSos")

    AsyncFunction("sendSms") { phone: String, message: String ->
      require(Regex("\\+?[0-9]{7,15}").matches(phone)) { "Número de contacto inválido" }
      require(message.isNotBlank() && message.length <= 500) { "Mensaje inválido" }

      val context = appContext.reactContext ?: error("Contexto de Android no disponible")
      @Suppress("DEPRECATION")
      val manager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        context.getSystemService(SmsManager::class.java)
      } else {
        SmsManager.getDefault()
      } ?: error("Servicio de SMS no disponible")

      val parts = manager.divideMessage(message)
      if (parts.size == 1) {
        manager.sendTextMessage(phone, null, parts[0], null, null)
      } else {
        manager.sendMultipartTextMessage(phone, null, parts, null, null)
      }
    }
  }
}
